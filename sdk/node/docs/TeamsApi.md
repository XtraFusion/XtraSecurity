# TeamsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createTeam**](#createteam) | **POST** /team | Create a new team|
|[**listTeams**](#listteams) | **GET** /team | List all teams|

# **createTeam**
> createTeam(createTeamRequest)


### Example

```typescript
import {
    TeamsApi,
    Configuration,
    CreateTeamRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamsApi(configuration);

let createTeamRequest: CreateTeamRequest; //

const { status, data } = await apiInstance.createTeam(
    createTeamRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createTeamRequest** | **CreateTeamRequest**|  | |


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
|**201** | Team created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listTeams**
> Array<Team> listTeams()


### Example

```typescript
import {
    TeamsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamsApi(configuration);

const { status, data } = await apiInstance.listTeams();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Team>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of teams |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

