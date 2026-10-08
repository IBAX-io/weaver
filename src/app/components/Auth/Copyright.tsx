/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';

// The copyright line under the sign-in pages, up to the current year
const Copyright: React.FC = () => (
    <FormattedMessage id="legal.copy" defaultMessage="IBAX © 2019 – {year}" values={{ year: new Date().getFullYear() }} />
);

export default Copyright;
