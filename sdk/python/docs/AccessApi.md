# openapi_client.AccessApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_access_request**](AccessApi.md#create_access_request) | **POST** /access-requests | Submit a JIT access request
[**list_access_requests**](AccessApi.md#list_access_requests) | **GET** /access-requests | List JIT access requests


# **create_access_request**
> create_access_request(create_access_request_request)

Submit a JIT access request

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.create_access_request_request import CreateAccessRequestRequest
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
    api_instance = openapi_client.AccessApi(api_client)
    create_access_request_request = openapi_client.CreateAccessRequestRequest() # CreateAccessRequestRequest | 

    try:
        # Submit a JIT access request
        api_instance.create_access_request(create_access_request_request)
    except Exception as e:
        print("Exception when calling AccessApi->create_access_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **create_access_request_request** | [**CreateAccessRequestRequest**](CreateAccessRequestRequest.md)|  | 

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
**201** | Request submitted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_access_requests**
> List[AccessRequest] list_access_requests()

List JIT access requests

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.access_request import AccessRequest
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
    api_instance = openapi_client.AccessApi(api_client)

    try:
        # List JIT access requests
        api_response = api_instance.list_access_requests()
        print("The response of AccessApi->list_access_requests:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AccessApi->list_access_requests: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[AccessRequest]**](AccessRequest.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of access requests |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

