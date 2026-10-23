package openapi

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"reflect"
	"strings"
	"time"

	"golang.org/x/crypto/hkdf"
)

// XtraClientOptions represents options for initializing the Go XtraSecurity Client.
type XtraClientOptions struct {
	Token               string
	ProjectID           string
	WorkspaceID         string
	APIURL              string
	Timeout             time.Duration
	VaultPassphrase     string
	WorkspacePassphrase string
	Scope               string
}

// XtraClient is the idiomatic developer-friendly wrapper for the Go SDK.
type XtraClient struct {
	apiClient           *APIClient
	projectID           string
	workspaceID         string
	vaultPassphrase     string
	workspacePassphrase string
	scope               string
}

// NewXtraClient initializes a new XtraClient with token and API configuration.
func NewXtraClient(opts XtraClientOptions) (*XtraClient, error) {
	token := opts.Token
	if token == "" {
		token = os.Getenv("XTRA_TOKEN")
	}
	if token == "" {
		return nil, fmt.Errorf("XtraSecurity API token is required (pass in options or set XTRA_TOKEN)")
	}

	apiURL := opts.APIURL
	if apiURL == "" {
		apiURL = os.Getenv("XTRA_API_URL")
	}
	if apiURL == "" {
		apiURL = "https://www.xtrasecurity.in/api"
	}

	projectID := opts.ProjectID
	if projectID == "" {
		projectID = os.Getenv("XTRA_PROJECT_ID")
	}

	workspaceID := opts.WorkspaceID
	if workspaceID == "" {
		workspaceID = os.Getenv("XTRA_WORKSPACE_ID")
	}

	scope := opts.Scope
	if scope == "" {
		scope = os.Getenv("XTRA_VAULT_SCOPE")
	}
	if scope == "" {
		scope = "workspace"
	}

	cfg := NewConfiguration()
	cfg.Host = apiURL
	cfg.DefaultHeader["Authorization"] = "Bearer " + token

	workspacePassphrase := opts.WorkspacePassphrase
	if workspacePassphrase == "" {
		workspacePassphrase = os.Getenv("XTRA_WORKSPACE_PASSPHRASE")
	}

	vaultPassphrase := opts.VaultPassphrase
	if vaultPassphrase == "" {
		vaultPassphrase = os.Getenv("XTRA_PROJECT_PASSPHRASE")
	}
	if vaultPassphrase == "" {
		vaultPassphrase = workspacePassphrase
	}
	if vaultPassphrase == "" {
		vaultPassphrase = os.Getenv("XTRA_VAULT_PASSPHRASE")
	}
	if vaultPassphrase == "" {
		vaultPassphrase = os.Getenv("XTRA_MASTER_SECRET")
	}

	client := NewAPIClient(cfg)
	return &XtraClient{
		apiClient:           client,
		projectID:           projectID,
		workspaceID:         workspaceID,
		vaultPassphrase:     vaultPassphrase,
		workspacePassphrase: workspacePassphrase,
		scope:               scope,
	}, nil
}

func DeriveProjectKey(projectID, passphrase string) []byte {
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_PROJECT_PASSPHRASE")
	}
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_WORKSPACE_PASSPHRASE")
	}
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_VAULT_PASSPHRASE")
	}
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_MASTER_SECRET")
	}
	if passphrase == "" {
		panic("Vault Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.")
	}
	salt := []byte(fmt.Sprintf("project_salt_%s", projectID))
	info := []byte("xtra-e2ee-project-key-v2")
	hash := sha256.New
	kdf := hkdf.New(hash, []byte(passphrase), salt, info)
	key := make([]byte, 32)
	io.ReadFull(kdf, key)
	return key
}

func DeriveWorkspaceKey(workspaceID, passphrase string) []byte {
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_WORKSPACE_PASSPHRASE")
	}
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_VAULT_PASSPHRASE")
	}
	if passphrase == "" {
		passphrase = os.Getenv("XTRA_MASTER_SECRET")
	}
	if passphrase == "" {
		panic("Workspace Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.")
	}
	salt := []byte(fmt.Sprintf("workspace_salt_%s", workspaceID))
	info := []byte("xtra-e2ee-workspace-key-v1")
	hash := sha256.New
	kdf := hkdf.New(hash, []byte(passphrase), salt, info)
	key := make([]byte, 32)
	io.ReadFull(kdf, key)
	return key
}

const VaultSentinelMagic = "xtra_vault_sentinel_token_v3_authenticated"

func CreateVaultSentinel(projectKey []byte) (*EncryptedPayload, error) {
	return EncryptSecretValue(VaultSentinelMagic, projectKey)
}

func VerifyVaultSentinel(payload EncryptedPayload, projectKey []byte) bool {
	decrypted, err := DecryptSecretValue(payload, projectKey)
	if err != nil {
		return false
	}
	return decrypted == VaultSentinelMagic
}

func CreateWorkspaceVaultSentinel(workspaceID, passphrase string) (*EncryptedPayload, error) {
	wsKey := DeriveWorkspaceKey(workspaceID, passphrase)
	return EncryptSecretValue(VaultSentinelMagic, wsKey)
}

func VerifyWorkspaceVaultSentinel(payload EncryptedPayload, workspaceID, passphrase string) bool {
	wsKey := DeriveWorkspaceKey(workspaceID, passphrase)
	decrypted, err := DecryptSecretValue(payload, wsKey)
	if err != nil {
		return false
	}
	return decrypted == VaultSentinelMagic
}

var bip39Words = []string{
	"abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
	"access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
	"action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
	"adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
	"agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
	"alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
	"always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
	"angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
	"anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
	"area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
	"arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
	"assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
	"audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
	"aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
	"bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
	"barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
	"beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
	"best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
	"bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
	"blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
	"boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
	"bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread",
	"breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze",
	"broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
	"bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy",
	"butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call",
	"calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas",
	"canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
	"cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category",
	"cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century",
	"cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase",
	"chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child",
	"chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle",
	"citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk",
	"clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close",
	"cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut",
	"code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort",
	"comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control",
	"convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost",
	"cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle",
	"craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek",
	"crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial",
	"cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup",
}

func GenerateRecoveryMnemonic() (string, string) {
	entropy := make([]byte, 32)
	io.ReadFull(rand.Reader, entropy)
	entropyHex := hex.EncodeToString(entropy)

	var words []string
	for i := 0; i < 24; i++ {
		byteIndex := (i * 4) % 32
		chunkHex := entropyHex[byteIndex : byteIndex+4]
		var val int
		fmt.Sscanf(chunkHex, "%x", &val)
		words = append(words, bip39Words[val%len(bip39Words)])
	}
	return strings.Join(words, " "), entropyHex
}

type EncryptedPayload struct {
	Ciphertext string `json:"ciphertext"`
	IV         string `json:"iv"`
	AuthTag    string `json:"authTag,omitempty"`
	Tag        string `json:"tag,omitempty"`
}

func EncryptSecretValue(plaintext string, projectKey []byte) (*EncryptedPayload, error) {
	block, err := aes.NewCipher(projectKey)
	if err != nil {
		return nil, err
	}
	iv := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	ciphertext := aesgcm.Seal(nil, iv, []byte(plaintext), nil)
	tagSize := 16
	ct := ciphertext[:len(ciphertext)-tagSize]
	authTag := ciphertext[len(ciphertext)-tagSize:]
	return &EncryptedPayload{
		Ciphertext: hex.EncodeToString(ct),
		IV:         hex.EncodeToString(iv),
		AuthTag:    hex.EncodeToString(authTag),
	}, nil
}

func DecryptSecretValue(payload EncryptedPayload, projectKey []byte) (string, error) {
	block, err := aes.NewCipher(projectKey)
	if err != nil {
		return "", err
	}
	iv, _ := hex.DecodeString(payload.IV)
	ct, _ := hex.DecodeString(payload.Ciphertext)
	tagStr := payload.AuthTag
	if tagStr == "" {
		tagStr = payload.Tag
	}
	tag, _ := hex.DecodeString(tagStr)
	
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	
	ctWithTag := append(ct, tag...)
	plaintext, err := aesgcm.Open(nil, iv, ctWithTag, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

// GetSecrets fetches all secrets for an environment with context timeout support (Task A29).
func (c *XtraClient) GetSecrets(ctx context.Context, env string, projectID ...string) (map[string]string, error) {
	pid := c.projectID
	if len(projectID) > 0 && projectID[0] != "" {
		pid = projectID[0]
	}
	if pid == "" {
		return nil, fmt.Errorf("project ID is required")
	}

	req := c.apiClient.SecretsAPI.GetSecrets(ctx)
	req = req.ProjectId(pid).Env(env)

	resp, _, err := req.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch secrets: %w", err)
	}

	secrets := make(map[string]string)
	projectKey := DeriveProjectKey(pid, c.vaultPassphrase)
	for k, v := range resp {
		if strVal, ok := v.(string); ok {
			if strings.HasPrefix(strVal, "{") && strings.Contains(strVal, "ciphertext") {
				var payload EncryptedPayload
				if err := json.Unmarshal([]byte(strVal), &payload); err == nil && payload.Ciphertext != "" {
					if dec, err := DecryptSecretValue(payload, projectKey); err == nil {
						strVal = dec
					}
				}
			}
			secrets[k] = strVal
		}
	}
	return secrets, nil
}

// UpsertSecrets encrypts and writes secrets using E2EE.
func (c *XtraClient) UpsertSecrets(ctx context.Context, env string, secrets map[string]string, projectID ...string) error {
	pid := c.projectID
	if len(projectID) > 0 && projectID[0] != "" {
		pid = projectID[0]
	}
	if pid == "" {
		return fmt.Errorf("project ID is required")
	}

	projectKey := DeriveProjectKey(pid, c.vaultPassphrase)
	encryptedSecrets := make(map[string]string)
	for k, v := range secrets {
		if strings.HasPrefix(v, "{") && strings.Contains(v, "ciphertext") {
			encryptedSecrets[k] = v
		} else {
			encPayload, err := EncryptSecretValue(v, projectKey)
			if err != nil {
				return err
			}
			encJSON, _ := json.Marshal(encPayload)
			encryptedSecrets[k] = string(encJSON)
		}
	}

	req := c.apiClient.SecretsAPI.UpsertSecrets(ctx, pid, env)
	req = req.UpsertSecretsRequest(UpsertSecretsRequest{Secrets: &encryptedSecrets})
	_, _, err := req.Execute()
	return err
}

// GetSecretWithTimeout retrieves a single secret key with context timeout & cancellation (Task A29).
func (c *XtraClient) GetSecretWithTimeout(parentCtx context.Context, key string, env string, timeout time.Duration) (string, error) {
	ctx, cancel := context.WithTimeout(parentCtx, timeout)
	defer cancel()

	secrets, err := c.GetSecrets(ctx, env)
	if err != nil {
		return "", err
	}

	val, exists := secrets[key]
	if !exists {
		return "", fmt.Errorf("secret key %q not found in environment %q", key, env)
	}
	return val, nil
}

// UnmarshalSecrets populates a struct tagged with `xtra:"KEY_NAME"` with fetched secret values.
func (c *XtraClient) UnmarshalSecrets(ctx context.Context, env string, v interface{}) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return fmt.Errorf("target v must be a non-nil pointer to a struct")
	}

	elem := rv.Elem()
	if elem.Kind() != reflect.Struct {
		return fmt.Errorf("target v must be a pointer to a struct")
	}

	secrets, err := c.GetSecrets(ctx, env)
	if err != nil {
		return err
	}

	t := elem.Type()
	for i := 0; i < elem.NumField(); i++ {
		field := elem.Field(i)
		fieldType := t.Field(i)

		tag := fieldType.Tag.Get("xtra")
		if tag == "" || tag == "-" {
			continue
		}

		if val, ok := secrets[tag]; ok {
			if field.CanSet() && field.Kind() == reflect.String {
				field.SetString(val)
			}
		}
	}
	return nil
}
