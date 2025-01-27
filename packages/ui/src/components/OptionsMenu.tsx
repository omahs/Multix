import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { IconButton, ListItemIcon, ListItemText } from '@mui/material'
import { MouseEvent, ReactNode, useCallback, useState } from 'react'
import { styled } from '@mui/material/styles'
import { HiEllipsisVertical as MoreVertIcon } from 'react-icons/hi2'

export interface MenuOption {
  text: string
  icon: ReactNode
  onClick: () => void
}

const ITEM_HEIGHT = 48

interface Props {
  className?: string
  options: MenuOption[]
}

const OptionsMenu = ({ className, options }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleMenuClick = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleClick = useCallback(
    (clickFunction: MenuOption['onClick']) => {
      handleClose()
      clickFunction()
    },
    [handleClose]
  )

  return (
    <div className={className}>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleMenuClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button'
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch'
          }
        }}
      >
        {options.map((option) => (
          <MenuItem
            className="menuEntry"
            key={option.text}
            onClick={() => handleClick(option.onClick)}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.text}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

export default styled(OptionsMenu)`
  margin-left: 0.5rem;

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    margin-left: 1rem;
  }
`
