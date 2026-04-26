# AuditLog

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | Pointer to **string** |  | [optional] 
**Action** | Pointer to **string** |  | [optional] 
**Entity** | Pointer to **string** |  | [optional] 
**EntityId** | Pointer to **string** |  | [optional] 
**Changes** | Pointer to **map[string]interface{}** |  | [optional] 
**Timestamp** | Pointer to **time.Time** |  | [optional] 

## Methods

### NewAuditLog

`func NewAuditLog() *AuditLog`

NewAuditLog instantiates a new AuditLog object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewAuditLogWithDefaults

`func NewAuditLogWithDefaults() *AuditLog`

NewAuditLogWithDefaults instantiates a new AuditLog object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetId

`func (o *AuditLog) GetId() string`

GetId returns the Id field if non-nil, zero value otherwise.

### GetIdOk

`func (o *AuditLog) GetIdOk() (*string, bool)`

GetIdOk returns a tuple with the Id field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetId

`func (o *AuditLog) SetId(v string)`

SetId sets Id field to given value.

### HasId

`func (o *AuditLog) HasId() bool`

HasId returns a boolean if a field has been set.

### GetAction

`func (o *AuditLog) GetAction() string`

GetAction returns the Action field if non-nil, zero value otherwise.

### GetActionOk

`func (o *AuditLog) GetActionOk() (*string, bool)`

GetActionOk returns a tuple with the Action field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetAction

`func (o *AuditLog) SetAction(v string)`

SetAction sets Action field to given value.

### HasAction

`func (o *AuditLog) HasAction() bool`

HasAction returns a boolean if a field has been set.

### GetEntity

`func (o *AuditLog) GetEntity() string`

GetEntity returns the Entity field if non-nil, zero value otherwise.

### GetEntityOk

`func (o *AuditLog) GetEntityOk() (*string, bool)`

GetEntityOk returns a tuple with the Entity field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetEntity

`func (o *AuditLog) SetEntity(v string)`

SetEntity sets Entity field to given value.

### HasEntity

`func (o *AuditLog) HasEntity() bool`

HasEntity returns a boolean if a field has been set.

### GetEntityId

`func (o *AuditLog) GetEntityId() string`

GetEntityId returns the EntityId field if non-nil, zero value otherwise.

### GetEntityIdOk

`func (o *AuditLog) GetEntityIdOk() (*string, bool)`

GetEntityIdOk returns a tuple with the EntityId field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetEntityId

`func (o *AuditLog) SetEntityId(v string)`

SetEntityId sets EntityId field to given value.

### HasEntityId

`func (o *AuditLog) HasEntityId() bool`

HasEntityId returns a boolean if a field has been set.

### GetChanges

`func (o *AuditLog) GetChanges() map[string]interface{}`

GetChanges returns the Changes field if non-nil, zero value otherwise.

### GetChangesOk

`func (o *AuditLog) GetChangesOk() (*map[string]interface{}, bool)`

GetChangesOk returns a tuple with the Changes field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetChanges

`func (o *AuditLog) SetChanges(v map[string]interface{})`

SetChanges sets Changes field to given value.

### HasChanges

`func (o *AuditLog) HasChanges() bool`

HasChanges returns a boolean if a field has been set.

### GetTimestamp

`func (o *AuditLog) GetTimestamp() time.Time`

GetTimestamp returns the Timestamp field if non-nil, zero value otherwise.

### GetTimestampOk

`func (o *AuditLog) GetTimestampOk() (*time.Time, bool)`

GetTimestampOk returns a tuple with the Timestamp field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetTimestamp

`func (o *AuditLog) SetTimestamp(v time.Time)`

SetTimestamp sets Timestamp field to given value.

### HasTimestamp

`func (o *AuditLog) HasTimestamp() bool`

HasTimestamp returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


