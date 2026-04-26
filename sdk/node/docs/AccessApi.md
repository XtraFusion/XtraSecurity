# AccessApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createAccessRequest**](#createaccessrequest) | **POST** /access-requests | Submit a JIT access request|
|[**listAccessRequests**](#listaccessrequests) | **GET** /access-requests | List JIT access requests|

# **createAccessRequest**
> createAccessRequest(createAccessRequestRequest)


### Example

```typescript
import {
    AccessApi,
    Configuration,
    CreateAccessRequestRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AccessApi(configuration);

let createAccessRequestRequest: CreateAccessRequestRequest; //

const { status, data } = await apiInstance.createAccessRequest(
    createAccessRequestRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createAccessRequestRequest** | **CreateAccessRequestRequest**|  | |


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
|**201** | Request submitted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listAccessRequests**
> Array<AccessRequest> listAccessRequests()


### Example

```typescript
import {
    AccessApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AccessApi(configuration);

const { status, data } = await apiInstance.listAccessRequests();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<AccessRequest>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of access requests |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

