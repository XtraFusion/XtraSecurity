# \AccessAPI

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**CreateAccessRequest**](AccessAPI.md#CreateAccessRequest) | **Post** /access-requests | Submit a JIT access request
[**ListAccessRequests**](AccessAPI.md#ListAccessRequests) | **Get** /access-requests | List JIT access requests



## CreateAccessRequest

> CreateAccessRequest(ctx).CreateAccessRequestRequest(createAccessRequestRequest).Execute()

Submit a JIT access request

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
	createAccessRequestRequest := *openapiclient.NewCreateAccessRequestRequest("Debugging production issue #1234", int32(60)) // CreateAccessRequestRequest | 

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	r, err := apiClient.AccessAPI.CreateAccessRequest(context.Background()).CreateAccessRequestRequest(createAccessRequestRequest).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `AccessAPI.CreateAccessRequest``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
}
```

### Path Parameters



### Other Parameters

Other parameters are passed through a pointer to a apiCreateAccessRequestRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createAccessRequestRequest** | [**CreateAccessRequestRequest**](CreateAccessRequestRequest.md) |  | 

### Return type

 (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)


## ListAccessRequests

> []AccessRequest ListAccessRequests(ctx).Execute()

List JIT access requests

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

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.AccessAPI.ListAccessRequests(context.Background()).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `AccessAPI.ListAccessRequests``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `ListAccessRequests`: []AccessRequest
	fmt.Fprintf(os.Stdout, "Response from `AccessAPI.ListAccessRequests`: %v\n", resp)
}
```

### Path Parameters

This endpoint does not need any parameter.

### Other Parameters

Other parameters are passed through a pointer to a apiListAccessRequestsRequest struct via the builder pattern


### Return type

[**[]AccessRequest**](AccessRequest.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)

