# AuditApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getAuditLogs**](#getauditlogs) | **GET** /audit | Get audit logs|

# **getAuditLogs**
> Array<AuditLog> getAuditLogs()


### Example

```typescript
import {
    AuditApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuditApi(configuration);

let workspaceId: string; // (optional) (default to undefined)
let limit: number; // (optional) (default to 50)
let page: number; // (optional) (default to 1)

const { status, data } = await apiInstance.getAuditLogs(
    workspaceId,
    limit,
    page
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | (optional) defaults to undefined|
| **limit** | [**number**] |  | (optional) defaults to 50|
| **page** | [**number**] |  | (optional) defaults to 1|


### Return type

**Array<AuditLog>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of audit logs |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden - Admin only |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

