# BranchesApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createBranch**](#createbranch) | **POST** /branch | Create a new branch|
|[**listBranches**](#listbranches) | **GET** /branch | List branches for a project|

# **createBranch**
> createBranch(createBranchRequest)


### Example

```typescript
import {
    BranchesApi,
    Configuration,
    CreateBranchRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchesApi(configuration);

let createBranchRequest: CreateBranchRequest; //

const { status, data } = await apiInstance.createBranch(
    createBranchRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createBranchRequest** | **CreateBranchRequest**|  | |


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Branch created |  -  |
|**400** | Bad Request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listBranches**
> Array<Branch> listBranches()


### Example

```typescript
import {
    BranchesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchesApi(configuration);

let projectId: string; // (default to undefined)

const { status, data } = await apiInstance.listBranches(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | defaults to undefined|


### Return type

**Array<Branch>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of branches |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

