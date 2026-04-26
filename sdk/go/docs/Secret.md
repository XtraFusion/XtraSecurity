# Secret

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Key** | Pointer to **string** |  | [optional] 
**Value** | Pointer to **string** |  | [optional] 
**Version** | Pointer to **string** |  | [optional] 
**IsReference** | Pointer to **bool** |  | [optional] 
**Source** | Pointer to **string** |  | [optional] 

## Methods

### NewSecret

`func NewSecret() *Secret`

NewSecret instantiates a new Secret object
This constructor will assign default values to properties that have it defined,
and makes sure properties required by API are set, but the set of arguments
will change when the set of required properties is changed

### NewSecretWithDefaults

`func NewSecretWithDefaults() *Secret`

NewSecretWithDefaults instantiates a new Secret object
This constructor will only assign default values to properties that have it defined,
but it doesn't guarantee that properties required by API are set

### GetKey

`func (o *Secret) GetKey() string`

GetKey returns the Key field if non-nil, zero value otherwise.

### GetKeyOk

`func (o *Secret) GetKeyOk() (*string, bool)`

GetKeyOk returns a tuple with the Key field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetKey

`func (o *Secret) SetKey(v string)`

SetKey sets Key field to given value.

### HasKey

`func (o *Secret) HasKey() bool`

HasKey returns a boolean if a field has been set.

### GetValue

`func (o *Secret) GetValue() string`

GetValue returns the Value field if non-nil, zero value otherwise.

### GetValueOk

`func (o *Secret) GetValueOk() (*string, bool)`

GetValueOk returns a tuple with the Value field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetValue

`func (o *Secret) SetValue(v string)`

SetValue sets Value field to given value.

### HasValue

`func (o *Secret) HasValue() bool`

HasValue returns a boolean if a field has been set.

### GetVersion

`func (o *Secret) GetVersion() string`

GetVersion returns the Version field if non-nil, zero value otherwise.

### GetVersionOk

`func (o *Secret) GetVersionOk() (*string, bool)`

GetVersionOk returns a tuple with the Version field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetVersion

`func (o *Secret) SetVersion(v string)`

SetVersion sets Version field to given value.

### HasVersion

`func (o *Secret) HasVersion() bool`

HasVersion returns a boolean if a field has been set.

### GetIsReference

`func (o *Secret) GetIsReference() bool`

GetIsReference returns the IsReference field if non-nil, zero value otherwise.

### GetIsReferenceOk

`func (o *Secret) GetIsReferenceOk() (*bool, bool)`

GetIsReferenceOk returns a tuple with the IsReference field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetIsReference

`func (o *Secret) SetIsReference(v bool)`

SetIsReference sets IsReference field to given value.

### HasIsReference

`func (o *Secret) HasIsReference() bool`

HasIsReference returns a boolean if a field has been set.

### GetSource

`func (o *Secret) GetSource() string`

GetSource returns the Source field if non-nil, zero value otherwise.

### GetSourceOk

`func (o *Secret) GetSourceOk() (*string, bool)`

GetSourceOk returns a tuple with the Source field if it's non-nil, zero value otherwise
and a boolean to check if the value has been set.

### SetSource

`func (o *Secret) SetSource(v string)`

SetSource sets Source field to given value.

### HasSource

`func (o *Secret) HasSource() bool`

HasSource returns a boolean if a field has been set.


[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


