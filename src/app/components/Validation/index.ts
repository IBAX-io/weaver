/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ValidatedCheckbox from './ValidatedCheckbox';
import ValidatedControl from './ValidatedControl';
import ValidatedFile from './ValidatedFile';
import ValidatedImage from 'containers/Validation/ValidatedImage';
import ValidatedMap from 'containers/Validation/ValidatedMap';
import ValidatedSelect from './ValidatedSelect';
import ValidationMessage from './ValidationMessage';
import ValidatedTextarea from './ValidatedTextarea';
import ValidatedForm from './ValidatedForm';
import ValidatedFormGroup from './ValidatedFormGroup';
import ValidatedRadioGroup from './ValidatedRadioGroup';
import ValidatedSubmit from './ValidatedSubmit';
import * as validators from './Validators';

export default {
    components: {
        ValidatedCheckbox,
        ValidatedControl,
        ValidatedFile,
        ValidatedImage,
        ValidatedMap,
        ValidatedSelect,
        ValidatedTextarea,
        ValidatedForm,
        ValidatedFormGroup,
        ValidatedRadioGroup,
        ValidatedSubmit,
        ValidationMessage
    },
    validators
};