- Max zoom level is a little wrong on MacBook 1/2 screen, the user can go through the board
- Preview side panel optional
- zoom someimes is weird ?
- I like the UI, it works well for 4 players, containing all necessary information, but for 2 players it should be bigger
- Search bar in cheat menus for easy lookup
- Can activate loot card right after activating first one without tooltip

- texture plateau
- resolve + stack plus visible
- macos gesture to go back that interfere with panning
- macos hand cards are cut at the bottom
- macos zoom is super slow
- players can go too far away from the board
- uniformized the icons
- history icons don't have a shrink-0
- get a zoomed view of the card when hovering it.
- If new board state, refresh prompt options

## Release

- Switch to 2D
- Animations for draw, play loot, souls to help with game readibility
  - V1:
    - [x] Loot card played
    - [x] Give coins
    - [x] Draw loot card from top deck
    - [x] Buy treasure from top deck or shop
    - [x] Gain bonus souls/monsters souls
  - V2:
    - Loot card effect resolve -> card goes from stack to discard
    - Passive effect from monster cards

- Contact form/bug report
- [x] When a cheat tool is used, everyone should be notified
- Only keep base game
- Purge inactive games
- Board background
- [x] Use canUseOnBoardSelection in the selection logic
- Replace start game with "I'm ready". When everyone is ready, the game starts
- [x] ~~Remove animationID~~ Use random indices in the back.
- Purge the 50 first animations seen when 100 animations were seen to avoid keeping to many in memory
- Padding top on board when on board selection so that the top player cards are visible

- Define logo/domain/name
- Animated starry background
- Fonts?
- dice animation (3D?)
- Cheat apply x times when the game was quit and restarted x times
