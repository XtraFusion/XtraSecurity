# NotificationsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createNotificationChannel**](#createnotificationchannel) | **POST** /notification-channels | Create a notification channel|
|[**createNotificationRule**](#createnotificationrule) | **POST** /notification-rules | Create a notification rule|
|[**listNotificationChannels**](#listnotificationchannels) | **GET** /notification-channels | List notification channels|
|[**listNotificationRules**](#listnotificationrules) | **GET** /notification-rules | List notification rules|
|[**listNotifications**](#listnotifications) | **GET** /notifications | List all alert notifications|

# **createNotificationChannel**
> createNotificationChannel(createNotificationChannelRequest)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    CreateNotificationChannelRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let createNotificationChannelRequest: CreateNotificationChannelRequest; //

const { status, data } = await apiInstance.createNotificationChannel(
    createNotificationChannelRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createNotificationChannelRequest** | **CreateNotificationChannelRequest**|  | |


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
|**201** | Channel created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createNotificationRule**
> createNotificationRule(createNotificationRuleRequest)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    CreateNotificationRuleRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let createNotificationRuleRequest: CreateNotificationRuleRequest; //

const { status, data } = await apiInstance.createNotificationRule(
    createNotificationRuleRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createNotificationRuleRequest** | **CreateNotificationRuleRequest**|  | |


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
|**201** | Rule created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listNotificationChannels**
> Array<NotificationChannel> listNotificationChannels()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.listNotificationChannels();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<NotificationChannel>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of channels |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listNotificationRules**
> Array<NotificationRule> listNotificationRules()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.listNotificationRules();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<NotificationRule>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of rules |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listNotifications**
> Array<Notification> listNotifications()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.listNotifications();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Notification>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of notifications |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

