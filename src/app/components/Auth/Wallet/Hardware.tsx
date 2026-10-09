/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { IModuleKeyRef } from 'ibax/auth';
import { IPkcs11, IPkcs11Key, IPkcs11Module, IPkcs11Token, TModuleCryptoer } from 'ibax/pkcs11';
import { authFailureCode, displayableAuthError } from 'modules/auth/util/authErrors';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';

export interface IHardwareProps {
  // The desktop app's module access
  pkcs11: IPkcs11;
  onAdd: (key: IModuleKeyRef) => void;
}

const CRYPTOER_NAMES: { [cryptoer in TModuleCryptoer]: string } = {
  ECC_P256: 'ECDSA P-256',
  MLDSA65: 'ML-DSA-65',
  MLDSA87: 'ML-DSA-87'
};

const ErrorNotice: React.FC<{ code: string }> = ({ code }) => (
  <div className="alert alert-danger text-start" role="alert">
    <FormattedMessage id={`auth.error.${code}`} defaultMessage={code} />
  </div>
);

// A key in a PKCS#11 module (a smart card, a USB token, an HSM) as an account: chosen or generated
// on a token after logging in to it. The account holds where the key is; the key never leaves the
// token, and every signature is the token's.
const Hardware: React.FC<IHardwareProps> = ({ pkcs11, onAdd }) => {
  const intl = useIntl();
  const [module, setModule] = useState<IPkcs11Module | null | undefined>(undefined);
  const [tokens, setTokens] = useState<IPkcs11Token[]>([]);
  const [token, setToken] = useState<IPkcs11Token | null>(null);
  const [keys, setKeys] = useState<IPkcs11Key[] | null>(null);
  const [pin, setPin] = useState('');
  const [cryptoer, setCryptoer] = useState<TModuleCryptoer | ''>('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Runs one module call at a time; a failure is shown with the auth error messages
  const run = useCallback(async (call: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await call();
    }
    catch (e) {
      setError(displayableAuthError(authFailureCode(e)));
    }
    finally {
      setBusy(false);
    }
  }, []);

  const refreshTokens = useCallback(() => run(async () => {
    setTokens(await pkcs11.tokens());
  }), [pkcs11, run]);

  useEffect(() => {
    run(async () => {
      const loaded = await pkcs11.module();
      setModule(loaded);
      if (loaded) {
        setTokens(await pkcs11.tokens());
      }
    });
  }, [pkcs11, run]);

  const onChooseModule = () => run(async () => {
    const chosen = await pkcs11.chooseModule();
    setModule(chosen);
    setToken(null);
    setKeys(null);
    setTokens(chosen ? await pkcs11.tokens() : []);
  });

  const onSelectToken = (selected: IPkcs11Token) => {
    setToken(selected);
    setKeys(null);
    setPin('');
    setCryptoer(selected.cryptoers[0] || '');
    setError(null);
  };

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await pkcs11.login(token.serial, token.protectedAuthPath ? null : pin);
      setPin('');
      setKeys(await pkcs11.keys(token.serial));
    });
  };

  const onGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoer) {
      return;
    }
    run(async () => {
      const key = await pkcs11.generateKey(token.serial, cryptoer, label.trim());
      setLabel('');
      setKeys([...(keys || []), key]);
    });
  };

  // The account is stored and the token logged out of: signing in asks for the PIN again
  const onUse = (key: IPkcs11Key) => run(async () => {
    await pkcs11.logout(token.serial).catch(() => undefined);
    onAdd({ token: { serial: token.serial, label: token.label }, id: key.id, label: key.label, cryptoer: key.cryptoer, publicKey: key.publicKey });
  });

  const onBack = () => {
    if (token && keys) {
      pkcs11.logout(token.serial).catch(() => undefined);
    }
    setToken(null);
    setKeys(null);
    refreshTokens();
  };

  return (
    <LocalizedDocumentTitle title="wallet.hardware" defaultTitle="Hardware key">
      <div>
        <HeadingNetwork returnUrl="/account">
          <FormattedMessage id="wallet.hardware" defaultMessage="Hardware key" />
        </HeadingNetwork>
        <div className="text-start" aria-busy={busy}>
          {error && <ErrorNotice code={error} />}

          <section className="mb-3" aria-labelledby="hardware-module">
            <h2 id="hardware-module" className="h6">
              <FormattedMessage id="wallet.hardware.module" defaultMessage="PKCS#11 module" />
            </h2>
            {module ? (
              <p className="small mb-2">
                {module.description || module.manufacturer} <span className="font-monospace text-muted">{module.path}</span>
              </p>
            ) : (
              undefined !== module && (
                <p className="small mb-2">
                  <FormattedMessage
                    id="wallet.hardware.module.none"
                    defaultMessage="Choose the PKCS#11 library of your token, as its vendor ships it (for example opensc-pkcs11.so)."
                  />
                </p>
              )
            )}
            <Button variant="link" className="px-0" disabled={busy} onClick={onChooseModule}>
              <FormattedMessage id="wallet.hardware.module.choose" defaultMessage="Choose module library" />
            </Button>
          </section>

          {module && !token && (
            <section className="mb-3" aria-labelledby="hardware-tokens">
              <h2 id="hardware-tokens" className="h6">
                <FormattedMessage id="wallet.hardware.tokens" defaultMessage="Tokens" />
              </h2>
              {0 === tokens.length && (
                <p className="small">
                  <FormattedMessage id="wallet.hardware.tokens.none" defaultMessage="No token is present. Insert one and refresh." />
                </p>
              )}
              {tokens.map(item => (
                <div key={item.serial} className="d-flex align-items-center mb-2">
                  <div className="flex-grow-1">
                    <div>{item.label || item.serial}</div>
                    <div className="small text-muted">
                      {[item.manufacturer, item.model, item.serial].filter(Boolean).join(' · ')}
                      {' · '}
                      {item.cryptoers.map(name => CRYPTOER_NAMES[name]).join(', ')}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" disabled={busy || item.pinLocked} onClick={() => onSelectToken(item)}>
                    {item.pinLocked
                      ? <FormattedMessage id="wallet.hardware.token.locked" defaultMessage="PIN locked" />
                      : <FormattedMessage id="wallet.hardware.token.open" defaultMessage="Open" />}
                  </Button>
                </div>
              ))}
              <Button variant="link" className="px-0" disabled={busy} onClick={refreshTokens}>
                <FormattedMessage id="wallet.hardware.tokens.refresh" defaultMessage="Refresh" />
              </Button>
            </section>
          )}

          {token && !keys && (
            <Form onSubmit={onLogin} className="mb-3">
              <h2 className="h6">{token.label || token.serial}</h2>
              {token.protectedAuthPath ? (
                <p className="small">
                  <FormattedMessage id="wallet.hardware.pin.pad" defaultMessage="Enter the PIN on the token's own PIN pad when it asks." />
                </p>
              ) : (
                <Form.Group className="mb-2" controlId="hardware-pin">
                  <Form.Label>
                    <FormattedMessage id="general.pin" defaultMessage="PIN" />
                  </Form.Label>
                  <Form.Control type="password" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} />
                  {token.pinFinalTry && (
                    <Form.Text className="text-danger">
                      <FormattedMessage id="wallet.hardware.pin.finalTry" defaultMessage="One wrong PIN more locks the token." />
                    </Form.Text>
                  )}
                </Form.Group>
              )}
              <div className="text-end">
                <Button type="button" variant="link" onClick={onBack}>
                  <FormattedMessage id="cancel" defaultMessage="Cancel" />
                </Button>
                <Button type="submit" variant="primary" disabled={busy || (!token.protectedAuthPath && !pin)}>
                  <FormattedMessage id="wallet.hardware.login" defaultMessage="Log in to token" />
                </Button>
              </div>
            </Form>
          )}

          {token && keys && (
            <>
              <section className="mb-3" aria-labelledby="hardware-keys">
                <h2 id="hardware-keys" className="h6">
                  <FormattedMessage id="wallet.hardware.keys" defaultMessage="Signing keys on {token}" values={{ token: token.label || token.serial }} />
                </h2>
                {0 === keys.length && (
                  <p className="small">
                    <FormattedMessage id="wallet.hardware.keys.none" defaultMessage="This token holds no signing key the app can use. Generate one below." />
                  </p>
                )}
                {keys.map(key => (
                  <div key={key.id} className="d-flex align-items-center mb-2">
                    <div className="flex-grow-1">
                      <div>{key.label || key.id}</div>
                      <div className="small text-muted">{CRYPTOER_NAMES[key.cryptoer]}</div>
                    </div>
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => onUse(key)}>
                      <FormattedMessage id="wallet.hardware.key.use" defaultMessage="Use this key" />
                    </Button>
                  </div>
                ))}
              </section>
              {token.cryptoers.length > 0 && (
                <Form onSubmit={onGenerate} className="mb-3">
                  <h2 className="h6">
                    <FormattedMessage id="wallet.hardware.generate" defaultMessage="Generate a key on the token" />
                  </h2>
                  <Form.Group className="mb-2" controlId="hardware-cryptoer">
                    <Form.Label>
                      <FormattedMessage id="wallet.hardware.algorithm" defaultMessage="Algorithm" />
                    </Form.Label>
                    <Form.Select value={cryptoer} onChange={e => setCryptoer(e.target.value as TModuleCryptoer)}>
                      {token.cryptoers.map(name => <option key={name} value={name}>{CRYPTOER_NAMES[name]}</option>)}
                    </Form.Select>
                    <Form.Text>
                      <FormattedMessage
                        id="wallet.hardware.algorithm.desc"
                        defaultMessage="The key signs for networks that use this algorithm only."
                      />
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-2" controlId="hardware-label">
                    <Form.Label>
                      <FormattedMessage id="wallet.hardware.label" defaultMessage="Label" />
                    </Form.Label>
                    <Form.Control
                      value={label}
                      maxLength={64}
                      placeholder={intl.formatMessage({ id: 'wallet.hardware.label.placeholder', defaultMessage: 'IBAX account' })}
                      onChange={e => setLabel(e.target.value)}
                    />
                  </Form.Group>
                  <div className="text-end">
                    <Button type="submit" variant="secondary" disabled={busy || !cryptoer}>
                      <FormattedMessage id="wallet.hardware.generate.confirm" defaultMessage="Generate key" />
                    </Button>
                  </div>
                </Form>
              )}
              <Button variant="link" className="px-0" onClick={onBack}>
                <FormattedMessage id="wallet.hardware.tokens.back" defaultMessage="Other tokens" />
              </Button>
            </>
          )}
        </div>
      </div>
    </LocalizedDocumentTitle>
  );
};

export default Hardware;
