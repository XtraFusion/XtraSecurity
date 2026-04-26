# openapi_client.NotificationsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_notification_channel**](NotificationsApi.md#create_notification_channel) | **POST** /notification-channels | Create a notification channel
[**create_notification_rule**](NotificationsApi.md#create_notification_rule) | **POST** /notification-rules | Create a notification rule
[**list_notification_channels**](NotificationsApi.md#list_notification_channels) | **GET** /notification-channels | List notification channels
[**list_notification_rules**](NotificationsApi.md#list_notification_rules) | **GET** /notification-rules | List notification rules
[**list_notifications**](NotificationsApi.md#list_notifications) | **GET** /notifications | List all alert notifications


# **create_notification_channel**
> create_notification_channel(create_notification_channel_request)

Create a notification channel

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.create_notification_channel_request import CreateNotificationChannelRequest
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
    api_instance = openapi_client.NotificationsApi(api_client)
    create_notification_channel_request = openapi_client.CreateNotificationChannelRequest() # CreateNotificationChannelRequest | 

    try:
        # Create a notification channel
        api_instance.create_notification_channel(create_notification_channel_request)
    except Exception as e:
        print("Exception when calling NotificationsApi->create_notification_channel: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **create_notification_channel_request** | [**CreateNotificationChannelRequest**](CreateNotificationChannelRequest.md)|  | 

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
**201** | Channel created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **create_notification_rule**
> create_notification_rule(create_notification_rule_request)

Create a notification rule

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.create_notification_rule_request import CreateNotificationRuleRequest
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
    api_instance = openapi_client.NotificationsApi(api_client)
    create_notification_rule_request = openapi_client.CreateNotificationRuleRequest() # CreateNotificationRuleRequest | 

    try:
        # Create a notification rule
        api_instance.create_notification_rule(create_notification_rule_request)
    except Exception as e:
        print("Exception when calling NotificationsApi->create_notification_rule: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **create_notification_rule_request** | [**CreateNotificationRuleRequest**](CreateNotificationRuleRequest.md)|  | 

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
**201** | Rule created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_notification_channels**
> List[NotificationChannel] list_notification_channels()

List notification channels

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.notification_channel import NotificationChannel
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
    api_instance = openapi_client.NotificationsApi(api_client)

    try:
        # List notification channels
        api_response = api_instance.list_notification_channels()
        print("The response of NotificationsApi->list_notification_channels:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling NotificationsApi->list_notification_channels: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[NotificationChannel]**](NotificationChannel.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of channels |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_notification_rules**
> List[NotificationRule] list_notification_rules()

List notification rules

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.notification_rule import NotificationRule
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
    api_instance = openapi_client.NotificationsApi(api_client)

    try:
        # List notification rules
        api_response = api_instance.list_notification_rules()
        print("The response of NotificationsApi->list_notification_rules:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling NotificationsApi->list_notification_rules: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[NotificationRule]**](NotificationRule.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of rules |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **list_notifications**
> List[Notification] list_notifications()

List all alert notifications

### Example

* Bearer (JWT) Authentication (BearerAuth):

```python
import openapi_client
from openapi_client.models.notification import Notification
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
    api_instance = openapi_client.NotificationsApi(api_client)

    try:
        # List all alert notifications
        api_response = api_instance.list_notifications()
        print("The response of NotificationsApi->list_notifications:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling NotificationsApi->list_notifications: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[Notification]**](Notification.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of notifications |  -  |
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

