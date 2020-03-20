import React from 'react'

import { MarketView } from './market_view'
import { useConnectedWeb3Context } from '../../hooks/connectedWeb3'
import { Loading } from '../common/loading'
import { useMarketMakerData } from '../../hooks/useMarketMakerData'
import { useQuestion } from '../../hooks/useQuestion'

interface Props {
  marketMakerAddress: string
}

const MarketViewContainer: React.FC<Props> = (props: Props) => {
  const context = useConnectedWeb3Context()

  const { marketMakerAddress } = props

  const { marketMakerData, status } = useMarketMakerData(marketMakerAddress, context)

  const { templateId, rawQuestion } = useQuestion(marketMakerAddress, context)

  const {
    marketMakerFunding,
    balances,
    collateral,
    question,
    questionId,
    resolution,
    arbitrator,
    category,
    isConditionResolved,
    isQuestionFinalized,
  } = marketMakerData

  if (!collateral) {
    return <Loading full={true} />
  }

  return (
    <MarketView
      account={context.account}
      balances={balances}
      funding={marketMakerFunding}
      marketMakerAddress={marketMakerAddress}
      status={status}
      collateral={collateral}
      questionId={questionId}
      question={question || ''}
      category={category || ''}
      resolution={resolution}
      arbitrator={arbitrator}
      isQuestionFinalized={isQuestionFinalized}
      isConditionResolved={isConditionResolved}
      templateId={templateId}
      rawQuestion={rawQuestion}
    />
  )
}

export { MarketViewContainer }
