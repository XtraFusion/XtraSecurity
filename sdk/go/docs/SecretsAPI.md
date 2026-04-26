# \SecretsAPI

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**GetSecrets**](SecretsAPI.md#GetSecrets) | **Get** /projects/{projectId}/envs/{env}/secrets | Get all secrets for an environment
[**UpsertSecrets**](SecretsAPI.md#UpsertSecrets) | **Post** /projects/{projectId}/envs/{env}/secrets | Create or update secrets



## GetSecrets

> map[string]string GetSecrets(ctx, projectId, env).Branch(branch).IncludeVersions(includeVersions).Execute()

Get all secrets for an environment



### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {
	projectId := "projectId_example" // string | The project ID
	env := "env_example" // string | The environment
	branch := "branch_example" // string | The branch to read from (optional) (default to "main")
	includeVersions := true // bool | Include version metadata for each secret (optional) (default to false)

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.SecretsAPI.GetSecrets(context.Background(), projectId, env).Branch(branch).IncludeVersions(includeVersions).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `SecretsAPI.GetSecrets``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `GetSecrets`: map[string]string
	fmt.Fprintf(os.Stdout, "Response from `SecretsAPI.GetSecrets`: %v\n", resp)
}
```

### Path Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**ctx** | **context.Context** | context for authentication, logging, cancellation, deadlines, tracing, etc.
**projectId** | **string** | The project ID | 
**env** | **string** | The environment | 

### Other Parameters

Other parameters are passed through a pointer to a apiGetSecretsRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------


 **branch** | **string** | The branch to read from | [default to &quot;main&quot;]
 **includeVersions** | **bool** | Include version metadata for each secret | [default to false]

### Return type

**map[string]string**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)


## UpsertSecrets

> UpsertSecrets200Response UpsertSecrets(ctx, projectId, env).UpsertSecretsRequest(upsertSecretsRequest).Execute()

Create or update secrets



### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {
	projectId := "projectId_example" // string | 
	env := "env_example" // string | 
	upsertSecretsRequest := *openapiclient.NewUpsertSecretsRequest() // UpsertSecretsRequest | 

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.SecretsAPI.UpsertSecrets(context.Background(), projectId, env).UpsertSecretsRequest(upsertSecretsRequest).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `SecretsAPI.UpsertSecrets``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `UpsertSecrets`: UpsertSecrets200Response
	fmt.Fprintf(os.Stdout, "Response from `SecretsAPI.UpsertSecrets`: %v\n", resp)
}
```

### Path Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
**ctx** | **context.Context** | context for authentication, logging, cancellation, deadlines, tracing, etc.
**projectId** | **string** |  | 
**env** | **string** |  | 

### Other Parameters

Other parameters are passed through a pointer to a apiUpsertSecretsRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------


 **upsertSecretsRequest** | [**UpsertSecretsRequest**](UpsertSecretsRequest.md) |  | 

### Return type

[**UpsertSecrets200Response**](UpsertSecrets200Response.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)

