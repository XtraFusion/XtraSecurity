# openapi_client.BranchesApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_branch**](BranchesApi.md#create_branch) | **POST** /branch | Create a new branch
[**list_branches**](BranchesApi.md#list_branches) | **GET** /branch | List branches for a project


# **create_branch**
> create_branch(create_branch_request)

Create a new branch

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.create_branch_request import CreateBranchRequest
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
    api_instance = openapi_client.BranchesApi(api_client)
    create_branch_request = openapi_client.CreateBranchRequest() # CreateBranchRequest | 

    try:
        # Create a new branch
        api_instance.create_branch(create_branch_request)
    except Exception as e:
        print("Exception when calling BranchesApi->create_branch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **create_branch_request** | [**CreateBranchRequest**](CreateBranchRequest.md)|  | 

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
**201** | Branch created |  -  |
**400** | Bad Request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_branches**
> List[Branch] list_branches(project_id)

List branches for a project

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.branch import Branch
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
    api_instance = openapi_client.BranchesApi(api_client)
    project_id = 'project_id_example' # str | 

    try:
        # List branches for a project
        api_response = api_instance.list_branches(project_id)
        print("The response of BranchesApi->list_branches:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BranchesApi->list_branches: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **project_id** | **str**|  | 

### Return type

[**List[Branch]**](Branch.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of branches |  -  |
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

