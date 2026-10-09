/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Routes, Route } from 'react-router';

import ActionSelector from 'containers/Auth/Wallet/ActionSelector';
import Create from 'containers/Auth/Wallet/Create';
import Import from 'containers/Auth/Wallet/Import';
import Hardware from 'containers/Auth/Wallet/Hardware';

// Rendered under '/account/*', so paths are relative to '/account'
const Wallet: React.FC = () => (
  <Routes>
    <Route path="create/*" element={<Create />} />
    <Route path="import/*" element={<Import />} />
    <Route path="hardware/*" element={<Hardware />} />
    <Route path="*" element={<ActionSelector />} />
  </Routes>
);

export default Wallet;
