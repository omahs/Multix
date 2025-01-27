import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Chip, CircularProgress, Grid, Paper } from '@mui/material'
import { useMultiProxy } from '../contexts/MultiProxyContext'
import TransactionList from '../components/Transactions/TransactionList'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button, ButtonWithIcon, Link } from '../components/library'
import AccountDisplay from '../components/AccountDisplay'
import { HiOutlinePaperAirplane, HiOutlinePencil } from 'react-icons/hi2'
import {
  MdOutlineLockReset as LockResetIcon,
  MdErrorOutline as ErrorOutlineIcon
} from 'react-icons/md'
import OptionsMenu, { MenuOption } from '../components/OptionsMenu'
import { AccountBadge } from '../types'
import SuccessCreation from '../components/SuccessCreation'
import NewMulisigAlert from '../components/NewMulisigAlert'
import { styled } from '@mui/material/styles'
import { renderMultisigHeading } from './multisigHelpers'
import { Center } from '../components/layout/Center'
import { useAccounts } from '../contexts/AccountsContext'
import { useWatchedAddresses } from '../contexts/WatchedAddressesContext'
import { useApi } from '../contexts/ApiContext'
import { useNetwork } from '../contexts/NetworkContext'
import { useModals } from '../contexts/ModalsContext'

interface Props {
  className?: string
}

interface MultisigActionMenuProps {
  setIsSendModalOpen: (isOpen: boolean) => void
  options: MenuOption[]
  withSendButton?: boolean
}

const MultisigActionMenu = ({
  setIsSendModalOpen,
  options,
  withSendButton = true
}: MultisigActionMenuProps) => {
  return (
    <>
      {withSendButton && (
        <ButtonWithIcon
          aria-label="send"
          onClick={() => setIsSendModalOpen(true)}
        >
          <HiOutlinePaperAirplaneStyled />
          Send
        </ButtonWithIcon>
      )}
      <OptionsMenu options={options} />
    </>
  )
}

const Home = ({ className }: Props) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams({
    creationInProgress: 'false'
  })
  const { setIsSendModalOpen, setIsEditModalOpen, setIsChangeMultiModalOpen } = useModals()
  const {
    isLoading,
    multiProxyList,
    selectedMultiProxy,
    selectedHasProxy,
    error: multisigQueryError,
    selectedIsWatched
  } = useMultiProxy()
  const { selectedNetworkInfo } = useNetwork()
  const { isApiReady } = useApi()
  const {
    isAllowedToConnectToExtension,
    isExtensionError,
    isAccountLoading,
    allowConnectionToExtension
  } = useAccounts()
  const [showNewMultisigAlert, setShowNewMultisigAlert] = useState(false)
  const { watchedAddresses } = useWatchedAddresses()
  const onClosenewMultisigAlert = useCallback(() => {
    setShowNewMultisigAlert(false)
    setSearchParams({ creationInProgress: 'false' })
  }, [setSearchParams])

  useEffect(() => {
    if (searchParams.get('creationInProgress') === 'true') {
      setShowNewMultisigAlert(true)
      setTimeout(() => {
        onClosenewMultisigAlert()
      }, 20000)
    }
  }, [onClosenewMultisigAlert, searchParams])

  const options: MenuOption[] = useMemo(() => {
    const opts = [
      {
        text: 'Edit names',
        icon: <HiOutlinePencil size={20} />,
        onClick: () => setIsEditModalOpen(true)
      }
    ]

    // allow rotation only for the multisigs with a proxy
    selectedHasProxy &&
      !selectedIsWatched &&
      opts.push({
        text: 'Change multisig',
        icon: <LockResetIcon size={20} />,
        onClick: () => setIsChangeMultiModalOpen(true)
      })

    return opts
  }, [selectedHasProxy, selectedIsWatched, setIsChangeMultiModalOpen, setIsEditModalOpen])

  if (!isAllowedToConnectToExtension && watchedAddresses.length === 0) {
    return (
      <CenterStyled>
        <h1>Multix is an interface to easily manage complex multisigs.</h1>
        <p>Connect an extension to interact with Multix or watch an address.</p>
        <WrapperConnectButtonStyled>
          <Button onClick={allowConnectionToExtension}>Connect Wallet</Button>
          or
          <Button onClick={() => navigate('/settings')}>Watch an address</Button>
        </WrapperConnectButtonStyled>
      </CenterStyled>
    )
  }

  if (!isApiReady || isAccountLoading) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          '&:first-of-type': {
            marginBottom: '1rem'
          }
        }}
      >
        <CircularProgress />
        {isAccountLoading
          ? 'Loading accounts...'
          : `Connecting to the node at ${selectedNetworkInfo?.rpcUrl}`}
      </Box>
    )
  }

  if (isExtensionError && !watchedAddresses)
    return (
      <CenterStyled>
        <h3>
          No account found. Please connect at least one in a wallet extension. More info at{' '}
          <Link
            href="https://wiki.polkadot.network/docs/wallets"
            target="_blank"
            rel="noreferrer"
          >
            wiki.polkadot.network
          </Link>
        </h3>
      </CenterStyled>
    )

  if (isLoading) {
    return (
      <Grid
        className={className}
        container
        spacing={2}
      >
        <Box className="loader">
          <CircularProgress />
          <div>Loading your multisigs...</div>
        </Box>
      </Grid>
    )
  }

  if (multisigQueryError) {
    return (
      <Grid
        className={className}
        container
        spacing={2}
      >
        <Box className="loader">
          <div className="multisigErrorMessage">
            <ErrorOutlineIcon size={64} />
            <div>An error occurred.</div>
          </div>
        </Box>
      </Grid>
    )
  }

  if (multiProxyList.length === 0) {
    return (
      <Grid
        className={className}
        container
        spacing={2}
      >
        <Box className="loader">
          {showNewMultisigAlert ? (
            <SuccessCreation />
          ) : (
            <WrapperConnectButtonStyled>
              No multisig found for your accounts or watched accounts.{' '}
              {isAllowedToConnectToExtension ? (
                <Button onClick={() => navigate('/create')}>Create one</Button>
              ) : (
                <Button onClick={allowConnectionToExtension}>Connect Wallet</Button>
              )}
              or
              <Button onClick={() => navigate('/settings')}>Watch one</Button>
            </WrapperConnectButtonStyled>
          )}
        </Box>
      </Grid>
    )
  }

  return (
    <Grid
      className={className}
      container
      spacing={2}
    >
      {showNewMultisigAlert && multiProxyList.length > 0 && showNewMultisigAlert && (
        <NewMulisigAlert onClose={onClosenewMultisigAlert} />
      )}
      <Grid
        item
        xs={12}
        md={6}
      >
        {selectedMultiProxy && (
          <div className="multiProxyWrapper">
            <div className="multiProxyColumn">
              {selectedHasProxy && (
                <div className="pureHeader">
                  <AccountDisplay
                    className="proxy"
                    address={selectedMultiProxy?.proxy || ''}
                    badge={AccountBadge.PURE}
                    withBalance
                  />
                  <BoxStyled>
                    <MultisigActionMenu
                      setIsSendModalOpen={setIsSendModalOpen}
                      options={options}
                      withSendButton={!selectedIsWatched}
                    />
                  </BoxStyled>
                </div>
              )}
              <HeaderStyled>
                <h3>{renderMultisigHeading(selectedMultiProxy.multisigs.length > 1)}</h3>
                <BoxStyled>
                  {!selectedHasProxy && (
                    <MultisigActionMenu
                      setIsSendModalOpen={setIsSendModalOpen}
                      options={options}
                      withSendButton={!selectedIsWatched}
                    />
                  )}
                </BoxStyled>
              </HeaderStyled>
              {selectedMultiProxy.multisigs.map((multisig) => {
                return (
                  <Paper
                    className="multisigWrapper"
                    key={multisig.address}
                  >
                    <AccountDisplayWrapperStyled>
                      <AccountDisplay
                        address={multisig.address || ''}
                        badge={AccountBadge.MULTI}
                        withBalance
                      />
                    </AccountDisplayWrapperStyled>
                    <div className="signatoriesWrapper">
                      <h4>
                        Signatories{' '}
                        <Chip
                          className="threshold"
                          label={`${multisig.threshold}/${multisig.signatories?.length}`}
                        />
                      </h4>
                      <ul className="addressList">
                        {multisig?.signatories?.map((signatory) => (
                          <li key={signatory}>
                            <AccountDisplay address={signatory} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Paper>
                )
              })}
            </div>
          </div>
        )}
      </Grid>
      {multiProxyList.length > 0 && (
        <Grid
          item
          xs={12}
          md={6}
        >
          <TransactionsWrapperStyled>
            <h3>Transactions</h3>
            <TransactionList />
          </TransactionsWrapperStyled>
        </Grid>
      )}
    </Grid>
  )
}

const TransactionsWrapperStyled = styled('div')(
  ({ theme }) => `
    @media (min-width: ${theme.breakpoints.values.md}px) {
        margin-left: 1.5rem;
    }
`
)

const AccountDisplayWrapperStyled = styled('div')`
  margin: 1rem 0 0 2rem;
`

const HeaderStyled = styled('header')`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BoxStyled = styled('div')`
  display: flex;
  align-items: center;
  padding-left: 1rem;
`

const HiOutlinePaperAirplaneStyled = styled(HiOutlinePaperAirplane)`
  transform: rotate(315deg);
  margin-top: -4px;
`

const WrapperConnectButtonStyled = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;

  & > button {
    margin: 0 1rem;
  }
`

const CenterStyled = styled(Center)`
  text-align: center;
`

export default styled(Home)(
  ({ theme }) => `
  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
    padding: 1rem;
  }

  .proxy, .multisig {
    min-width: 0;
    margin-bottom: 0;
  }

  .threshold {
    background-color: ${theme.custom.background.primary};
  }

  .addressList {
    padding-inline-start: 0;
    margin-block-end: 0;
    list-style-type: none;
    > li {
      margin-bottom: 1rem;
    }
  }

  .multiProxyWrapper {
    display: flex;
    align-items: center;
    margin: 1rem 0;
  }

  .signatoriesWrapper {
    & > h2 {
      margin-bottom: 0;
    }
    margin-left: 2rem;
  }

  .titleWrapper {
    align-items: center;
  }

  .multiProxyColumn {
    flex: 1;
    min-width: 0;

    & > h3 {
      margin-top: 0;
    }
  }

  .buttonColumn {
    display: flex;
    align-self: flex-start;
  }

  .pureHeader {
    margin: 0 0 1rem 0.5rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    
    @media (min-width: ${theme.breakpoints.values.md}px) {
        margin: 0 0 1rem 0;
    }
  }

  .multisigWrapper {
    padding: .5rem 0;
    margin-bottom: .5rem;
  }

  .multisigErrorMessage {
    text-align: center;
    margin-top: 1rem;
  }
`
)
