/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import themed from 'components/Theme/themed';

export default themed.div`
    border-top: solid 1px ${(props) => props.theme.dropdownMenuSeparator};
    height: 30px;
    line-height: 30px;
    padding: 0 12px;
    font-size: 11px;
    text-transform: uppercase;
    color: ${(props) => props.theme.dropdownMenuSecondary};

    &:first-child {
        border-top: none;
    }
`;
