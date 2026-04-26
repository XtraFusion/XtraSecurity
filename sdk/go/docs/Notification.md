# Notification

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | Pointer to **string** |  | [optional] 
**Title** | Pointer to **string** |  | [optional] 
**Message** | Pointer to **string** |  | [optional] 
**Severity** | Pointer to **string** |  | [optional] 
**Type** | Pointer to **string** |  | [optional] 
**Read** | Pointer to **bool** |  | [optional] 
**Timestamp** | Pointer to **time.Time** |  | [optional] 

## Methods

### NewNotification

`func NewNotification() *Notification`

NewNotification instantiates a new Notification object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewNotificationWithDefaults

`func NewNotificationWithDefaults() *Notification`

NewNotificationWithDefaults instantiates a new Notification object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetId

`func (o *Notification) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *Notification) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *Notification) SetId(v string)`

SetId sets Id field to given value.

### HasId

`func (o *Notification) HasId() bool`

HasId returns a boolean if a field has been set.

### GetTitle

`func (o *Notification) GetTitle() string`

GetTitle returns the Title field if non-nil, zero value otherwise.

### GetTitleOk

`func (o *Notification) GetTitleOk() (*string, bool)`

GetTitleOk returns a tuple with the Title field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTitle

`func (o *Notification) SetTitle(v string)`

SetTitle sets Title field to given value.

### HasTitle

`func (o *Notification) HasTitle() bool`

HasTitle returns a boolean if a field has been set.

### GetMessage

`func (o *Notification) GetMessage() string`

GetMessage returns the Message field if non-nil, zero value otherwise.

### GetMessageOk

`func (o *Notification) GetMessageOk() (*string, bool)`

GetMessageOk returns a tuple with the Message field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetMessage

`func (o *Notification) SetMessage(v string)`

SetMessage sets Message field to given value.

### HasMessage

`func (o *Notification) HasMessage() bool`

HasMessage returns a boolean if a field has been set.

### GetSeverity

`func (o *Notification) GetSeverity() string`

GetSeverity returns the Severity field if non-nil, zero value otherwise.

### GetSeverityOk

`func (o *Notification) GetSeverityOk() (*string, bool)`

GetSeverityOk returns a tuple with the Severity field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSeverity

`func (o *Notification) SetSeverity(v string)`

SetSeverity sets Severity field to given value.

### HasSeverity

`func (o *Notification) HasSeverity() bool`

HasSeverity returns a boolean if a field has been set.

### GetType

`func (o *Notification) GetType() string`

GetType returns the Type field if non-nil, zero value otherwise.

### GetTypeOk

`func (o *Notification) GetTypeOk() (*string, bool)`

GetTypeOk returns a tuple with the Type field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetType

`func (o *Notification) SetType(v string)`

SetType sets Type field to given value.

### HasType

`func (o *Notification) HasType() bool`

HasType returns a boolean if a field has been set.

### GetRead

`func (o *Notification) GetRead() bool`

GetRead returns the Read field if non-nil, zero value otherwise.

### GetReadOk

`func (o *Notification) GetReadOk() (*bool, bool)`

GetReadOk returns a tuple with the Read field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetRead

`func (o *Notification) SetRead(v bool)`

SetRead sets Read field to given value.

### HasRead

`func (o *Notification) HasRead() bool`

HasRead returns a boolean if a field has been set.

### GetTimestamp

`func (o *Notification) GetTimestamp() time.Time`

GetTimestamp returns the Timestamp field if non-nil, zero value otherwise.

### GetTimestampOk

`func (o *Notification) GetTimestampOk() (*time.Time, bool)`

GetTimestampOk returns a tuple with the Timestamp field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTimestamp

`func (o *Notification) SetTimestamp(v time.Time)`

SetTimestamp sets Timestamp field to given value.

### HasTimestamp

`func (o *Notification) HasTimestamp() bool`

HasTimestamp returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


