package openapi

import (
	"context"
	"fmt"
	"os"
	"reflect"
	"time"
)

// XtraClientOptions represents options for initializing the Go XtraSecurity Client.
type XtraClientOptions struct {
	Token     string
	ProjectID string
	APIURL    string
	Timeout   time.Duration
}

// XtraClient is the idiomatic developer-friendly wrapper for the Go SDK.
type XtraClient struct {
	apiClient *APIClient
	projectID string
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

	client := NewAPIClient(cfg)
	return &XtraClient{
		apiClient: client,
		projectID: projectID,
	}, nil
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
	for k, v := range resp {
		if strVal, ok := v.(string); ok {
			secrets[k] = strVal
		}
	}
	return secrets, nil
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
