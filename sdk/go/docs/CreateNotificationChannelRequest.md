# CreateNotificationChannelRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Type** | **string** |  | 
**Name** | **string** |  | 
**Config** | **map[string]interface{}** | Channel-specific config. For Slack: &#x60;{ webhookUrl }&#x60;. For email: &#x60;{ email }&#x60;. For webhook: &#x60;{ url }&#x60;. | 

## Methods

### NewCreateNotificationChannelRequest

`func NewCreateNotificationChannelRequest(type_ string, name string, config map[string]interface{}, ) *CreateNotificationChannelRequest`

NewCreateNotificationChannelRequest instantiates a new CreateNotificationChannelRequest object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewCreateNotificationChannelRequestWithDefaults

`func NewCreateNotificationChannelRequestWithDefaults() *CreateNotificationChannelRequest`

NewCreateNotificationChannelRequestWithDefaults instantiates a new CreateNotificationChannelRequest object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetType

`func (o *CreateNotificationChannelRequest) GetType() string`

GetType returns the Type field if non-nil, zero value otherwise.

### GetTypeOk

`func (o *CreateNotificationChannelRequest) GetTypeOk() (*string, bool)`

GetTypeOk returns a tuple with the Type field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetType

`func (o *CreateNotificationChannelRequest) SetType(v string)`

SetType sets Type field to given value.


### GetName

`func (o *CreateNotificationChannelRequest) GetName() string`

GetName returns the Name field if non-nil, zero value otherwise.

### GetNameOk

`func (o *CreateNotificationChannelRequest) GetNameOk() (*string, bool)`

GetNameOk returns a tuple with the Name field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetName

`func (o *CreateNotificationChannelRequest) SetName(v string)`

SetName sets Name field to given value.


### GetConfig

`func (o *CreateNotificationChannelRequest) GetConfig() map[string]interface{}`

GetConfig returns the Config field if non-nil, zero value otherwise.

### GetConfigOk

`func (o *CreateNotificationChannelRequest) GetConfigOk() (*map[string]interface{}, bool)`

GetConfigOk returns a tuple with the Config field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetConfig

`func (o *CreateNotificationChannelRequest) SetConfig(v map[string]interface{})`

SetConfig sets Config field to given value.



[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


