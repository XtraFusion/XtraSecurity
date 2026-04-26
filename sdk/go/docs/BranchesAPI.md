# \BranchesAPI

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**CreateBranch**](BranchesAPI.md#CreateBranch) | **Post** /branch | Create a new branch
[**ListBranches**](BranchesAPI.md#ListBranches) | **Get** /branch | List branches for a project



## CreateBranch

> CreateBranch(ctx).CreateBranchRequest(createBranchRequest).Execute()

Create a new branch

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
	createBranchRequest := *openapiclient.NewCreateBranchRequest("feature/new-api", "ProjectId_example") // CreateBranchRequest | 

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	r, err := apiClient.BranchesAPI.CreateBranch(context.Background()).CreateBranchRequest(createBranchRequest).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `BranchesAPI.CreateBranch``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
}
```

### Path Parameters



### Other Parameters

Other parameters are passed through a pointer to a apiCreateBranchRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createBranchRequest** | [**CreateBranchRequest**](CreateBranchRequest.md) |  | 

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


## ListBranches

> []Branch ListBranches(ctx).ProjectId(projectId).Execute()

List branches for a project

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

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.BranchesAPI.ListBranches(context.Background()).ProjectId(projectId).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `BranchesAPI.ListBranches``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `ListBranches`: []Branch
	fmt.Fprintf(os.Stdout, "Response from `BranchesAPI.ListBranches`: %v\n", resp)
}
```

### Path Parameters



### Other Parameters

Other parameters are passed through a pointer to a apiListBranchesRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **projectId** | **string** |  | 

### Return type

[**[]Branch**](Branch.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)

