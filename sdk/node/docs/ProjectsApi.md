# ProjectsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createProject**](#createproject) | **POST** /projects | Create a new project|
|[**listProjects**](#listprojects) | **GET** /projects | List all projects|

# **createProject**
> Project createProject(createProjectRequest)


### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    CreateProjectRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let createProjectRequest: CreateProjectRequest; //

const { status, data } = await apiInstance.createProject(
    createProjectRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createProjectRequest** | **CreateProjectRequest**|  | |


### Return type

**Project**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Project created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listProjects**
> Array<Project> listProjects()

Returns all projects the authenticated user has access to.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

const { status, data } = await apiInstance.listProjects();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Project>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of projects |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

