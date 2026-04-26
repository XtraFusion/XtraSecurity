# \NotificationsAPI

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**CreateNotificationChannel**](NotificationsAPI.md#CreateNotificationChannel) | **Post** /notification-channels | Create a notification channel
[**CreateNotificationRule**](NotificationsAPI.md#CreateNotificationRule) | **Post** /notification-rules | Create a notification rule
[**ListNotificationChannels**](NotificationsAPI.md#ListNotificationChannels) | **Get** /notification-channels | List notification channels
[**ListNotificationRules**](NotificationsAPI.md#ListNotificationRules) | **Get** /notification-rules | List notification rules
[**ListNotifications**](NotificationsAPI.md#ListNotifications) | **Get** /notifications | List all alert notifications



## CreateNotificationChannel

> CreateNotificationChannel(ctx).CreateNotificationChannelRequest(createNotificationChannelRequest).Execute()

Create a notification channel

### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {
	createNotificationChannelRequest := *openapiclient.NewCreateNotificationChannelRequest("Type_example", "Slack - Security Alerts", map[string]interface{}(123)) // CreateNotificationChannelRequest | 

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	r, err := apiClient.NotificationsAPI.CreateNotificationChannel(context.Background()).CreateNotificationChannelRequest(createNotificationChannelRequest).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `NotificationsAPI.CreateNotificationChannel``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
}
```

### Path Parameters



### Other Parameters

Other parameters are passed through a pointer to a apiCreateNotificationChannelRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createNotificationChannelRequest** | [**CreateNotificationChannelRequest**](CreateNotificationChannelRequest.md) |  | 

### Return type

 (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)


## CreateNotificationRule

> CreateNotificationRule(ctx).CreateNotificationRuleRequest(createNotificationRuleRequest).Execute()

Create a notification rule

### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {
	createNotificationRuleRequest := *openapiclient.NewCreateNotificationRuleRequest("Name_example", []string{"Triggers_example"}, []string{"Channels_example"}) // CreateNotificationRuleRequest | 

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	r, err := apiClient.NotificationsAPI.CreateNotificationRule(context.Background()).CreateNotificationRuleRequest(createNotificationRuleRequest).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `NotificationsAPI.CreateNotificationRule``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
}
```

### Path Parameters



### Other Parameters

Other parameters are passed through a pointer to a apiCreateNotificationRuleRequest struct via the builder pattern


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createNotificationRuleRequest** | [**CreateNotificationRuleRequest**](CreateNotificationRuleRequest.md) |  | 

### Return type

 (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)


## ListNotificationChannels

> []NotificationChannel ListNotificationChannels(ctx).Execute()

List notification channels

### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.NotificationsAPI.ListNotificationChannels(context.Background()).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `NotificationsAPI.ListNotificationChannels``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `ListNotificationChannels`: []NotificationChannel
	fmt.Fprintf(os.Stdout, "Response from `NotificationsAPI.ListNotificationChannels`: %v\n", resp)
}
```

### Path Parameters

This endpoint does not need any parameter.

### Other Parameters

Other parameters are passed through a pointer to a apiListNotificationChannelsRequest struct via the builder pattern


### Return type

[**[]NotificationChannel**](NotificationChannel.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)


## ListNotificationRules

> []NotificationRule ListNotificationRules(ctx).Execute()

List notification rules

### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.NotificationsAPI.ListNotificationRules(context.Background()).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `NotificationsAPI.ListNotificationRules``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `ListNotificationRules`: []NotificationRule
	fmt.Fprintf(os.Stdout, "Response from `NotificationsAPI.ListNotificationRules`: %v\n", resp)
}
```

### Path Parameters

This endpoint does not need any parameter.

### Other Parameters

Other parameters are passed through a pointer to a apiListNotificationRulesRequest struct via the builder pattern


### Return type

[**[]NotificationRule**](NotificationRule.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)


## ListNotifications

> []Notification ListNotifications(ctx).Execute()

List all alert notifications

### Example

```go
package main

import (
	"context"
	"fmt"
	"os"
	openapiclient "github.com/GIT_USER_ID/GIT_REPO_ID"
)

func main() {

	configuration := openapiclient.NewConfiguration()
	apiClient := openapiclient.NewAPIClient(configuration)
	resp, r, err := apiClient.NotificationsAPI.ListNotifications(context.Background()).Execute()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error when calling `NotificationsAPI.ListNotifications``: %v\n", err)
		fmt.Fprintf(os.Stderr, "Full HTTP response: %v\n", r)
	}
	// response from `ListNotifications`: []Notification
	fmt.Fprintf(os.Stdout, "Response from `NotificationsAPI.ListNotifications`: %v\n", resp)
}
```

### Path Parameters

This endpoint does not need any parameter.

### Other Parameters

Other parameters are passed through a pointer to a apiListNotificationsRequest struct via the builder pattern


### Return type

[**[]Notification**](Notification.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints)
[[Back to Model list]](../README.md#documentation-for-models)
[[Back to README]](../README.md)

