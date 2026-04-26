# NotificationRule

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | Pointer to **string** |  | [optional] 
**Name** | Pointer to **string** |  | [optional] 
**Description** | Pointer to **string** |  | [optional] 
**Enabled** | Pointer to **bool** |  | [optional] 
**Triggers** | Pointer to **[]string** |  | [optional] 
**Channels** | Pointer to **[]string** |  | [optional] 

## Methods

### NewNotificationRule

`func NewNotificationRule() *NotificationRule`

NewNotificationRule instantiates a new NotificationRule object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewNotificationRuleWithDefaults

`func NewNotificationRuleWithDefaults() *NotificationRule`

NewNotificationRuleWithDefaults instantiates a new NotificationRule object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetId

`func (o *NotificationRule) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *NotificationRule) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *NotificationRule) SetId(v string)`

SetId sets Id field to given value.

### HasId

`func (o *NotificationRule) HasId() bool`

HasId returns a boolean if a field has been set.

### GetName

`func (o *NotificationRule) GetName() string`

GetName returns the Name field if non-nil, zero value otherwise.

### GetNameOk

`func (o *NotificationRule) GetNameOk() (*string, bool)`

GetNameOk returns a tuple with the Name field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetName

`func (o *NotificationRule) SetName(v string)`

SetName sets Name field to given value.

### HasName

`func (o *NotificationRule) HasName() bool`

HasName returns a boolean if a field has been set.

### GetDescription

`func (o *NotificationRule) GetDescription() string`

GetDescription returns the Description field if non-nil, zero value otherwise.

### GetDescriptionOk

`func (o *NotificationRule) GetDescriptionOk() (*string, bool)`

GetDescriptionOk returns a tuple with the Description field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetDescription

`func (o *NotificationRule) SetDescription(v string)`

SetDescription sets Description field to given value.

### HasDescription

`func (o *NotificationRule) HasDescription() bool`

HasDescription returns a boolean if a field has been set.

### GetEnabled

`func (o *NotificationRule) GetEnabled() bool`

GetEnabled returns the Enabled field if non-nil, zero value otherwise.

### GetEnabledOk

`func (o *NotificationRule) GetEnabledOk() (*bool, bool)`

GetEnabledOk returns a tuple with the Enabled field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetEnabled

`func (o *NotificationRule) SetEnabled(v bool)`

SetEnabled sets Enabled field to given value.

### HasEnabled

`func (o *NotificationRule) HasEnabled() bool`

HasEnabled returns a boolean if a field has been set.

### GetTriggers

`func (o *NotificationRule) GetTriggers() []string`

GetTriggers returns the Triggers field if non-nil, zero value otherwise.

### GetTriggersOk

`func (o *NotificationRule) GetTriggersOk() (*[]string, bool)`

GetTriggersOk returns a tuple with the Triggers field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTriggers

`func (o *NotificationRule) SetTriggers(v []string)`

SetTriggers sets Triggers field to given value.

### HasTriggers

`func (o *NotificationRule) HasTriggers() bool`

HasTriggers returns a boolean if a field has been set.

### GetChannels

`func (o *NotificationRule) GetChannels() []string`

GetChannels returns the Channels field if non-nil, zero value otherwise.

### GetChannelsOk

`func (o *NotificationRule) GetChannelsOk() (*[]string, bool)`

GetChannelsOk returns a tuple with the Channels field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetChannels

`func (o *NotificationRule) SetChannels(v []string)`

SetChannels sets Channels field to given value.

### HasChannels

`func (o *NotificationRule) HasChannels() bool`

HasChannels returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


