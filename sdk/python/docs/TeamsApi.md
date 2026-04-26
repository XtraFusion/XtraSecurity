# openapi_client.TeamsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_team**](TeamsApi.md#create_team) | **POST** /team | Create a new team
[**list_teams**](TeamsApi.md#list_teams) | **GET** /team | List all teams


# **create_team**
> create_team(create_team_request)

Create a new team

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.create_team_request import CreateTeamRequest
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
    api_instance = openapi_client.TeamsApi(api_client)
    create_team_request = openapi_client.CreateTeamRequest() # CreateTeamRequest | 

    try:
        # Create a new team
        api_instance.create_team(create_team_request)
    except Exception as e:
        print("Exception when calling TeamsApi->create_team: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **create_team_request** | [**CreateTeamRequest**](CreateTeamRequest.md)|  | 

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
**201** | Team created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_teams**
> List[Team] list_teams()

List all teams

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.team import Team
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
    api_instance = openapi_client.TeamsApi(api_client)

    try:
        # List all teams
        api_response = api_instance.list_teams()
        print("The response of TeamsApi->list_teams:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling TeamsApi->list_teams: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[Team]**](Team.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of teams |  -  |
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

