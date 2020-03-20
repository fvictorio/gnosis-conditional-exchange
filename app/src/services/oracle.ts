import { Contract, ethers, utils, Wallet } from 'ethers'
import { BigNumber } from 'ethers/utils'

import { getLogger } from '../util/logger'
import { TransactionReceipt } from 'ethers/providers'

const logger = getLogger('Services::Oracle')

const oracleAbi = [
  'function resolve(bytes32 questionId, uint256 templateId, string question, uint256 numOutcomes) external',
]

export class OracleService {
  contract: Contract
  provider: any

  constructor(address: string, provider: any, signerAddress: Maybe<string>) {
    if (signerAddress) {
      const signer: Wallet = provider.getSigner()
      this.contract = new ethers.Contract(address, oracleAbi, provider).connect(signer)
    } else {
      this.contract = new ethers.Contract(address, oracleAbi, provider)
    }
    this.provider = provider
  }

  get address(): string {
    return this.contract.address
  }

  /**
   * Resolve the condition with the given questionId
   */
  resolveCondition = async (
    questionId: string,
    templateId: BigNumber,
    question: string,
    numOutcomes: number,
  ): Promise<TransactionReceipt> => {
    try {
      const transactionObject = await this.contract.resolve(
        questionId,
        templateId,
        question,
        numOutcomes,
      )
      return this.provider.waitForTransaction(transactionObject.hash)
    } catch (err) {
      logger.error(
        `There was an error resolving the condition with questionid '${questionId}'`,
        err.message,
      )
      throw err
    }
  }

  static encodeResolveCondition = (
    questionId: string,
    templateId: BigNumber,
    question: string,
    numOutcomes: number,
  ): string => {
    const oracleInterface = new utils.Interface(oracleAbi)

    return oracleInterface.functions.resolve.encode([questionId, templateId, question, numOutcomes])
  }
}
