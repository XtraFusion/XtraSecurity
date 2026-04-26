# SecretsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getSecrets**](#getsecrets) | **GET** /projects/{projectId}/envs/{env}/secrets | Get all secrets for an environment|
|[**upsertSecrets**](#upsertsecrets) | **POST** /projects/{projectId}/envs/{env}/secrets | Create or update secrets|

# **getSecrets**
> { [key: string]: string; } getSecrets()

Returns all decrypted key-value pairs for the given project and environment. Requires `secret.read` permission.

### Example

```typescript
import {
    SecretsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SecretsApi(configuration);

let projectId: string; //The project ID (default to undefined)
let env: 'development' | 'staging' | 'production'; //The environment (default to undefined)
let branch: string; //The branch to read from (optional) (default to 'main')
let includeVersions: boolean; //Include version metadata for each secret (optional) (default to false)

const { status, data } = await apiInstance.getSecrets(
    projectId,
    env,
    branch,
    includeVersions
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] | The project ID | defaults to undefined|
| **env** | [**&#39;development&#39; | &#39;staging&#39; | &#39;production&#39;**]**Array<&#39;development&#39; &#124; &#39;staging&#39; &#124; &#39;production&#39;>** | The environment | defaults to undefined|
| **branch** | [**string**] | The branch to read from | (optional) defaults to 'main'|
| **includeVersions** | [**boolean**] | Include version metadata for each secret | (optional) defaults to false|


### Return type

**{ [key: string]: string; }**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Key-value map of secrets |  -  |
|**401** | Unauthorized |  -  |
|**403** | Access Denied or JIT Elevation Required |  -  |
|**404** | Project or Branch not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertSecrets**
> UpsertSecrets200Response upsertSecrets(upsertSecretsRequest)

Bulk upsert secrets. Provide a key-value map. Supports optimistic locking via `expectedVersions`.

### Example

```typescript
import {
    SecretsApi,
    Configuration,
    UpsertSecretsRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SecretsApi(configuration);

let projectId: string; // (default to undefined)
let env: 'development' | 'staging' | 'production'; // (default to undefined)
let upsertSecretsRequest: UpsertSecretsRequest; //

const { status, data } = await apiInstance.upsertSecrets(
    projectId,
    env,
    upsertSecretsRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **upsertSecretsRequest** | **UpsertSecretsRequest**|  | |
| **projectId** | [**string**] |  | defaults to undefined|
| **env** | [**&#39;development&#39; | &#39;staging&#39; | &#39;production&#39;**]**Array<&#39;development&#39; &#124; &#39;staging&#39; &#124; &#39;production&#39;>** |  | defaults to undefined|


### Return type

**UpsertSecrets200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Secrets upserted |  -  |
|**401** | Unauthorized |  -  |
|**404** | Project or Branch not found |  -  |
|**409** | Version conflict detected |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

