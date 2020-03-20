import React, { useEffect, useState } from 'react'
import styled, { withTheme } from 'styled-components'
import { BigNumber } from 'ethers/utils'

import { ViewCard } from '../../common/view_card'
import { Button, OutcomeTable } from '../../common'
import { Loading } from '../../common/loading'
import { ButtonContainer } from '../../common/button_container'
import { SubsectionTitle } from '../../common/subsection_title'
import { TitleValue } from '../../common/title_value'
import { ClosedMarket } from '../../common/closed_market'
import { Arbitrator, BalanceItem, OutcomeTableValue, Status, Token } from '../../../util/types'
import { CPKService, ERC20Service } from '../../../services'
import { useConnectedWeb3Context, WhenConnected } from '../../../hooks/connectedWeb3'
import { getLogger } from '../../../util/logger'
import { formatBigNumber, formatDate } from '../../../util/tools'
import { useContracts } from '../../../hooks/useContracts'
import { DisplayArbitrator } from '../../common/display_arbitrator'
import { MARKET_FEE } from '../../../common/constants'

const Grid = styled.div`
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 14px;
  grid-template-columns: 1fr;
  margin-bottom: 25px;

  @media (min-width: ${props => props.theme.themeBreakPoints.md}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`

interface Props {
  theme?: any
  balances: BalanceItem[]
  collateral: Token
  funding: BigNumber
  question: string
  questionId: string
  resolution: Date | null
  marketMakerAddress: string
  isConditionResolved: boolean
  arbitrator: Maybe<Arbitrator>
  templateId: BigNumber
  rawQuestion: string
}

const logger = getLogger('Market::ClosedMarketDetail')

export const ClosedMarketDetailWrapper = (props: Props) => {
  const context = useConnectedWeb3Context()
  const { library: provider, account } = context
  const { conditionalTokens, oracle, buildMarketMaker, realitio } = useContracts(context)

  const {
    collateral: collateralToken,
    balances,
    marketMakerAddress,
    resolution,
    funding,
    isConditionResolved,
    questionId,
    arbitrator,
    templateId,
    rawQuestion,
  } = props

  const [status, setStatus] = useState<Status>(Status.Ready)
  const [message, setMessage] = useState('')
  const [collateral, setCollateral] = useState<BigNumber>(new BigNumber(0))

  const marketMaker = buildMarketMaker(marketMakerAddress)

  const resolveCondition = async () => {
    try {
      setStatus(Status.Loading)
      setMessage('Resolve condition...')

      const question = await realitio.getQuestion(questionId)

      // Balances length is the number of outcomes
      await oracle.resolveCondition(
        questionId,
        question.templateId,
        question.rawQuestion,
        balances.length,
      )

      setStatus(Status.Ready)
    } catch (err) {
      setStatus(Status.Error)
      logger.log(`Error trying to resolve condition: ${err.message}`)
    }
  }

  useEffect(() => {
    let isSubscribed = true

    const fetchBalance = async () => {
      const collateralAddress = await marketMaker.getCollateralToken()
      const collateralService = new ERC20Service(provider, account, collateralAddress)
      const collateralBalance = await collateralService.getCollateral(marketMakerAddress)
      if (isSubscribed) setCollateral(collateralBalance)
    }

    fetchBalance()

    return () => {
      isSubscribed = false
    }
  }, [collateral, provider, account, marketMakerAddress, marketMaker])

  const fundingFormat = formatBigNumber(funding, collateralToken.decimals)
  const collateralFormat = `${formatBigNumber(collateral, collateralToken.decimals)} ${
    collateralToken.symbol
  }`
  const resolutionFormat = resolution ? formatDate(resolution) : ''
  const winningOutcome = balances.find((balanceItem: BalanceItem) => balanceItem.winningOutcome)

  const redeem = async () => {
    try {
      setStatus(Status.Loading)
      setMessage('Redeem payout...')

      const cpk = await CPKService.create(provider)

      await cpk.redeemPositions({
        isConditionResolved,
        questionId,
        numOutcomes: balances.length,
        winningOutcome,
        oracle,
        collateralToken,
        marketMaker,
        conditionalTokens,
        templateId,
        rawQuestion,
      })

      setStatus(Status.Ready)
    } catch (err) {
      setStatus(Status.Error)
      logger.log(`Error trying to resolve condition or redeem: ${err.message}`)
    }
  }

  const probabilities = balances.map(balance => balance.probability)

  const disabledColumns = [OutcomeTableValue.CurrentPrice]
  if (!account) {
    disabledColumns.push(OutcomeTableValue.Shares)
  }

  return (
    <>
      <ClosedMarket date={resolutionFormat} />
      <ViewCard>
        {<SubsectionTitle>Balance</SubsectionTitle>}
        <OutcomeTable
          balances={balances}
          collateral={collateralToken}
          disabledColumns={disabledColumns}
          withWinningOutcome={true}
          displayRadioSelection={false}
          probabilities={probabilities}
        />

        <SubsectionTitle>Details</SubsectionTitle>
        <Grid>
          <TitleValue title="Category" value="Politics" />
          <TitleValue
            title={'Arbitrator'}
            value={arbitrator && <DisplayArbitrator arbitrator={arbitrator} />}
          />
          <TitleValue title="Resolution Date" value={resolutionFormat} />
          <TitleValue title="Fee" value={`${MARKET_FEE}%`} />
          <TitleValue title="Funding" value={fundingFormat} />
        </Grid>
        <SubsectionTitle>Market Results</SubsectionTitle>
        <Grid>
          <TitleValue title="Collateral" value={collateralFormat} />
        </Grid>
        <WhenConnected>
          <ButtonContainer>
            {winningOutcome && !winningOutcome.shares.isZero() && (
              <Button onClick={() => redeem()}>Redeem</Button>
            )}
            {!isConditionResolved && winningOutcome && winningOutcome.shares.isZero() && (
              <Button onClick={resolveCondition}>Resolve Condition</Button>
            )}
          </ButtonContainer>
        </WhenConnected>
      </ViewCard>
      {status === Status.Loading ? <Loading full={true} message={message} /> : null}
    </>
  )
}

export const ClosedMarketDetail = withTheme(ClosedMarketDetailWrapper)
