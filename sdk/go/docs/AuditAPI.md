# \AuditAPI

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**GetAuditLogs**](AuditAPI.md#GetAuditLogs) | **Get** /audit | Get audit logs



## GetAuditLogs

> []AuditLog GetAuditLogs(ctx).WorkspaceId(workspaceId).Limit(limit).Page(page).Execute()

Get audit logs

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
	workspaceId := "workspaceId_example" // string |  (optional)
	limit := int32(56) // int32 |  (optional) (default to 50)
	page := int32(56) // int32 |  (optional) (default to 1)

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.AuditAPI.GetAuditLogs(context.Background()).WorkspaceId(workspaceId).Limit(limit).Page(page).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `AuditAPI.GetAuditLogs``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `GetAuditLogs`: []AuditLog
	fmt.Fprintf(os.Stdout, "Response from `AuditAPI.GetAuditLogs`: %v\n", resp)
}
```

### Path Parameters



### Other Parameters

Other parameters are passed through a pointer to a apiGetAuditLogsRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **string** |  | 
 **limit** | **int32** |  | [default to 50]
 **page** | **int32** |  | [default to 1]

### Return type

[**[]AuditLog**](AuditLog.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)

