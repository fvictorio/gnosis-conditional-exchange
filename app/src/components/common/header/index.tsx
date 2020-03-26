import React, { useState } from 'react'
import styled from 'styled-components'
import { withRouter } from 'react-router'
import { RouteComponentProps } from 'react-router-dom'
import { useWeb3Context } from 'web3-react/dist'

import { IS_CORONA_FORK } from '../../../common/constants'
import { ButtonConnectWallet } from '../button_connect_wallet'
import { ButtonDisconnectWallet } from '../button_disconnect_wallet'
import { ConnectedWeb3 } from '../../../hooks/connectedWeb3'
import { useIsBlacklistedCountry } from '../../../hooks/geoJs'
import { MainMenu } from '../main_menu'
import { MobileMenu } from '../mobile_menu'
import { ModalConnectWallet } from '../modal_connect_wallet'
import { Network } from '../network'

const HeaderWrapper = styled.div`
  background: ${props => props.theme.header.backgroundColor};
  border-bottom: 1px solid ${props => props.theme.borders.borderColor};
  display: flex;
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  height: ${props => props.theme.header.height};
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 5;
`

const HeaderInner = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 100%;
  padding: 0 10px;
  position: relative;
  width: ${props => props.theme.themeBreakPoints.xxl};

  @media (min-width: ${props => props.theme.themeBreakPoints.md}) {
    padding: 0 ${props => props.theme.paddings.mainPadding};
  }
`

const MobileMenuStyled = styled(MobileMenu)`
  display: inherit;

  @media (min-width: ${props => props.theme.themeBreakPoints.md}) {
    display: none;
  }
`

const MainMenuStyled = styled(MainMenu)`
  display: none;

  @media (min-width: ${props => props.theme.themeBreakPoints.md}) {
    display: inherit;
  }
`

const NetworkStyled = styled(Network)`
  margin: 0 0 0 auto;

  @media (max-width: ${props => props.theme.themeBreakPoints.md}) {
    background-color: #fefefe;
    border-bottom: 1px solid ${props => props.theme.borders.borderColor};
    height: 23px;
    justify-content: flex-end;
    left: 0;
    padding: 0 10px;
    position: absolute;
    top: calc(100% + 1px);
    width: 100%;
  }
`

const ButtonDisconnectWalletStyled = styled(ButtonDisconnectWallet)`
  margin: 0 0 0 25px;
`

const ButtonConnectWalletStyled = styled(ButtonConnectWallet)`
  margin: 0 0 0 auto;
`

const HeaderContainer: React.FC<RouteComponentProps> = (props: RouteComponentProps) => {
  const isBlacklistedCountry = useIsBlacklistedCountry()
  const context = useWeb3Context()

  const { ...restProps } = props
  const [isMenuOpen, setMenuState] = useState(false)
  const [isModalOpen, setModalState] = useState(false)
  const toggleMenu = () => setMenuState(!isMenuOpen)

  // hide connect button if country is blacklisted, or the info isn't available yet
  const hideConnectButton =
    IS_CORONA_FORK && (isBlacklistedCountry === null || isBlacklistedCountry === true)

  return (
    <HeaderWrapper {...restProps}>
      <HeaderInner>
        <MainMenuStyled {...restProps} />
        <MobileMenuStyled toggleMenu={toggleMenu} isMenuOpen={isMenuOpen} {...restProps} />
        <ConnectedWeb3>
          <NetworkStyled />
          <ButtonDisconnectWalletStyled
            callback={() => {
              setModalState(false)
            }}
          />
        </ConnectedWeb3>
        {!context.account && !hideConnectButton && (
          <ButtonConnectWalletStyled
            onClick={() => {
              setModalState(true)
            }}
            modalState={isModalOpen}
          />
        )}
        <ModalConnectWallet isOpen={isModalOpen} onClose={() => setModalState(false)} />
      </HeaderInner>
    </HeaderWrapper>
  )
}

export const Header = withRouter(HeaderContainer)
