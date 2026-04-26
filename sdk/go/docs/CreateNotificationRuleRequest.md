# CreateNotificationRuleRequest

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Name** | **string** |  | 
**Description** | Pointer to **string** |  | [optional] 
**Triggers** | **[]string** |  | 
**Channels** | **[]string** |  | 
**Conditions** | Pointer to **map[string]interface{}** |  | [optional] 

## Methods

### NewCreateNotificationRuleRequest

`func NewCreateNotificationRuleRequest(name string, triggers []string, channels []string, ) *CreateNotificationRuleRequest`

NewCreateNotificationRuleRequest instantiates a new CreateNotificationRuleRequest object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewCreateNotificationRuleRequestWithDefaults

`func NewCreateNotificationRuleRequestWithDefaults() *CreateNotificationRuleRequest`

NewCreateNotificationRuleRequestWithDefaults instantiates a new CreateNotificationRuleRequest object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetName

`func (o *CreateNotificationRuleRequest) GetName() string`

GetName returns the Name field if non-nil, zero value otherwise.

### GetNameOk

`func (o *CreateNotificationRuleRequest) GetNameOk() (*string, bool)`

GetNameOk returns a tuple with the Name field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetName

`func (o *CreateNotificationRuleRequest) SetName(v string)`

SetName sets Name field to given value.


### GetDescription

`func (o *CreateNotificationRuleRequest) GetDescription() string`

GetDescription returns the Description field if non-nil, zero value otherwise.

### GetDescriptionOk

`func (o *CreateNotificationRuleRequest) GetDescriptionOk() (*string, bool)`

GetDescriptionOk returns a tuple with the Description field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDescription

`func (o *CreateNotificationRuleRequest) SetDescription(v string)`

SetDescription sets Description field to given value.

### HasDescription

`func (o *CreateNotificationRuleRequest) HasDescription() bool`

HasDescription returns a boolean if a field has been set.

### GetTriggers

`func (o *CreateNotificationRuleRequest) GetTriggers() []string`

GetTriggers returns the Triggers field if non-nil, zero value otherwise.

### GetTriggersOk

`func (o *CreateNotificationRuleRequest) GetTriggersOk() (*[]string, bool)`

GetTriggersOk returns a tuple with the Triggers field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTriggers

`func (o *CreateNotificationRuleRequest) SetTriggers(v []string)`

SetTriggers sets Triggers field to given value.


### GetChannels

`func (o *CreateNotificationRuleRequest) GetChannels() []string`

GetChannels returns the Channels field if non-nil, zero value otherwise.

### GetChannelsOk

`func (o *CreateNotificationRuleRequest) GetChannelsOk() (*[]string, bool)`

GetChannelsOk returns a tuple with the Channels field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetChannels

`func (o *CreateNotificationRuleRequest) SetChannels(v []string)`

SetChannels sets Channels field to given value.


### GetConditions

`func (o *CreateNotificationRuleRequest) GetConditions() map[string]interface{}`

GetConditions returns the Conditions field if non-nil, zero value otherwise.

### GetConditionsOk

`func (o *CreateNotificationRuleRequest) GetConditionsOk() (*map[string]interface{}, bool)`

GetConditionsOk returns a tuple with the Conditions field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetConditions

`func (o *CreateNotificationRuleRequest) SetConditions(v map[string]interface{})`

SetConditions sets Conditions field to given value.

### HasConditions

`func (o *CreateNotificationRuleRequest) HasConditions() bool`

HasConditions returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


