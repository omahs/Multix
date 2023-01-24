import { Box, Button, Grid, Step, StepLabel, Stepper } from "@mui/material";
import { useCallback, useMemo, useState } from "react"
import styled from "styled-components";
import { useApi } from "../../contexts/ApiContext";
import SignatorySelection from "../../components/SignatorySelection";
import { encodeAddress, createKeyMulti, sortAddresses } from "@polkadot/util-crypto";
import { config } from "../../config";
import { useAccountList } from "../../contexts/AccountsContext";
import ThresholdSelection from "./ThresholdSelection";
import Summary from "./Summary";
import { useGetSigningCallback } from "../../hooks/useGetSigningCallback";
import { useNavigate } from "react-router-dom";
import { useToasts } from "../../contexts/ToastContext";

interface Props {
  className?: string
}

const steps = [
  "Signatories",
  "Threshold",
  "Review"
]
const MultisigCreation = ({ className }: Props) => {
  const [signatories, setSignatories] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const isLastStep = useMemo(() => currentStep === steps.length - 1, [currentStep])
  const { api, isApiReady } = useApi()
  const [threshold, setThreshold] = useState<number | undefined>()
  const { selectedSigner, selectedAccount } = useAccountList()
  const navigate = useNavigate()
  const signCallBack = useGetSigningCallback({ onSuccess: () => navigate("/") })
  const { addToast } = useToasts()
  const canGoNext = useMemo(() => {

    // need a threshold set
    if (currentStep === 1 && threshold === undefined) {
      return false
    }

    // need at least 2 signatories
    if (currentStep === 0 && signatories.length < 2) {
      return false
    }

    return true
  }, [currentStep, signatories.length, threshold])

  const handleCreate = useCallback(async () => {
    if (!isApiReady) {
      console.error('api is not ready')
      return
    }

    if (!selectedAccount) {
      console.error('no selected address')
      return
    }

    if (!signatories.includes(selectedAccount.address)) {
      console.error('selected account not part of signatories')
      return
    }

    if (!threshold) {
      console.error("Threshold is invalid", threshold)
      return
    }

    const otherSignatories = sortAddresses(signatories.filter((sig) => sig !== selectedAccount.address))
    const multiAddress = encodeAddress(createKeyMulti(signatories, threshold), config.prefix)
    const proxyTx = api.tx.proxy.createPure("Any", 0, 0)
    const multiSigProxyCall = api.tx.multisig.asMulti(threshold, otherSignatories, null, proxyTx, 0)
    const transferTx = api.tx.balances.transfer(multiAddress, 1000000000000)
    const batchCall = api.tx.utility.batch([transferTx, multiSigProxyCall])


    batchCall.signAndSend(selectedAccount.address, { signer: selectedSigner }, signCallBack)
      .catch((error: Error) => {
        addToast({ title: error.message, type: "error" })
      })

  }, [addToast, api, isApiReady, selectedAccount, selectedSigner, signCallBack, signatories, threshold])

  return (
    <Grid
      className={className}
      container
      spacing={2}
    >
      <Grid
        item
        xs={12}
        md={4}
      >
        <h1 className="title">{steps[currentStep]}</h1>
      </Grid>

      <Grid
        item
        container
        direction="row"
        justifyContent="center"
        alignItems="center"
        xs={12}
        md={8}
      >
        <Box className="stepsContainer">
          <Stepper
            activeStep={currentStep}
            alternativeLabel
          >
            {steps.map((step, index) => (
              <Step
                className="stepItem"
                key={step}
                onClick={() => { currentStep > index && setCurrentStep(index) }}
              >
                <StepLabel>{currentStep === index ? "" : step}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Grid>
      <Grid container item xs={12}>
        {currentStep === 0 && (
          <Grid
            item
            xs={12}
            md={6}
          >
            <SignatorySelection
              setSignatories={setSignatories}
              signatories={signatories}
            />
          </Grid>
        )}
        {currentStep === 1 && (
          <Grid
            item
            xs={12}
            md={6}
          >
            <ThresholdSelection
              setThreshold={setThreshold}
              threshold={threshold}
              signatoriesNumber={signatories.length}
            />
          </Grid>
        )}
        {currentStep === 2 && (
          <Grid
            item
            xs={12}
            md={6}
          >
            <Summary
              signatories={signatories}
              threshold={threshold}
            />
          </Grid>
        )}
      </Grid>
      <Grid
        item
        container
        xs={12}
        justifyContent="center"
        className="buttonContainer"
      >
        <Button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          Back
        </Button>
        <Button
          disabled={!canGoNext}
          onClick={() => isLastStep ? handleCreate() : setCurrentStep(currentStep + 1)}
        >
          {isLastStep
            ? "Create"
            : "Next"
          }
        </Button>
      </Grid>
    </Grid>
  )
}

export default styled(MultisigCreation)(({ theme }) => `
  .stepItem {
    cursor: pointer;
  }

  .stepsContainer {
    width: 100%;
  }

  .buttonContainer button:first-child {
    margin-right: 2rem;
  }
`)