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
	Token           string
	ProjectID       string
	APIURL          string
	Timeout         time.Duration
	VaultPassphrase string
}

// XtraClient is the idiomatic developer-friendly wrapper for the Go SDK.
type XtraClient struct {
	apiClient       *APIClient
	projectID       string
	vaultPassphrase string
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

	cfg := NewConfiguration()
	cfg.Host = apiURL
	cfg.DefaultHeader["Authorization"] = "Bearer " + token

	vaultPassphrase := opts.VaultPassphrase
	if vaultPassphrase == "" {
		vaultPassphrase = os.Getenv("XTRA_VAULT_PASSPHRASE")
	}
	if vaultPassphrase == "" {
		vaultPassphrase = os.Getenv("XTRA_MASTER_SECRET")
	}

	client := NewAPIClient(cfg)
	return &XtraClient{
		apiClient:       client,
		projectID:       projectID,
		vaultPassphrase: vaultPassphrase,
	}, nil
}

func DeriveProjectKey(projectID, passphrase string) []byte {
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
