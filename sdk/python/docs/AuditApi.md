# openapi_client.AuditApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_audit_logs**](AuditApi.md#get_audit_logs) | **GET** /audit | Get audit logs


# **get_audit_logs**
> List[AuditLog] get_audit_logs(workspace_id=workspace_id, limit=limit, page=page)

Get audit logs

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.audit_log import AuditLog
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
    api_instance = openapi_client.AuditApi(api_client)
    workspace_id = 'workspace_id_example' # str |  (optional)
    limit = 50 # int |  (optional) (default to 50)
    page = 1 # int |  (optional) (default to 1)

    try:
        # Get audit logs
        api_response = api_instance.get_audit_logs(workspace_id=workspace_id, limit=limit, page=page)
        print("The response of AuditApi->get_audit_logs:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuditApi->get_audit_logs: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspace_id** | **str**|  | [optional] 
 **limit** | **int**|  | [optional] [default to 50]
 **page** | **int**|  | [optional] [default to 1]

### Return type

[**List[AuditLog]**](AuditLog.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of audit logs |  -  |
**401** | Unauthorized |  -  |
**403** | Forbidden - Admin only |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

