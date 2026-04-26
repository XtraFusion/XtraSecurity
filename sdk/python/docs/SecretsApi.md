# openapi_client.SecretsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_secrets**](SecretsApi.md#get_secrets) | **GET** /projects/{projectId}/envs/{env}/secrets | Get all secrets for an environment
[**upsert_secrets**](SecretsApi.md#upsert_secrets) | **POST** /projects/{projectId}/envs/{env}/secrets | Create or update secrets


# **get_secrets**
> Dict[str, str] get_secrets(project_id, env, branch=branch, include_versions=include_versions)

Get all secrets for an environment

Returns all decrypted key-value pairs for the given project and environment. Requires `secret.read` permission.

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization (JWT): BearerAuth
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.SecretsApi(api_client)
    project_id = 'project_id_example' # str | The project ID
    env = 'env_example' # str | The environment
    branch = 'main' # str | The branch to read from (optional) (default to 'main')
    include_versions = False # bool | Include version metadata for each secret (optional) (default to False)

    try:
        # Get all secrets for an environment
        api_response = api_instance.get_secrets(project_id, env, branch=branch, include_versions=include_versions)
        print("The response of SecretsApi->get_secrets:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SecretsApi->get_secrets: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **project_id** | **str**| The project ID | 
 **env** | **str**| The environment | 
 **branch** | **str**| The branch to read from | [optional] [default to &#39;main&#39;]
 **include_versions** | **bool**| Include version metadata for each secret | [optional] [default to False]

### Return type

**Dict[str, str]**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Key-value map of secrets |  -  |
**401** | Unauthorized |  -  |
**403** | Access Denied or JIT Elevation Required |  -  |
**404** | Project or Branch not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsert_secrets**
> UpsertSecrets200Response upsert_secrets(project_id, env, upsert_secrets_request)

Create or update secrets

Bulk upsert secrets. Provide a key-value map. Supports optimistic locking via `expectedVersions`.

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.upsert_secrets200_response import UpsertSecrets200Response
from openapi_client.models.upsert_secrets_request import UpsertSecretsRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization (JWT): BearerAuth
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.SecretsApi(api_client)
    project_id = 'project_id_example' # str | 
    env = 'env_example' # str | 
    upsert_secrets_request = openapi_client.UpsertSecretsRequest() # UpsertSecretsRequest | 

    try:
        # Create or update secrets
        api_response = api_instance.upsert_secrets(project_id, env, upsert_secrets_request)
        print("The response of SecretsApi->upsert_secrets:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SecretsApi->upsert_secrets: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **project_id** | **str**|  | 
 **env** | **str**|  | 
 **upsert_secrets_request** | [**UpsertSecretsRequest**](UpsertSecretsRequest.md)|  | 

### Return type

[**UpsertSecrets200Response**](UpsertSecrets200Response.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Secrets upserted |  -  |
**401** | Unauthorized |  -  |
**404** | Project or Branch not found |  -  |
**409** | Version conflict detected |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

