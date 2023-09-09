---
layout: post
title:  "Unoxian Werewolf: Dev Log 1"
date:   2023-09-06 12:35:19 +0800
categories: devlog unox
tags: [telegram]
---
Inspired by the [One Night Ultimate Series](https://beziergames.com/collections/one-night-ultimate-werewolf) by Ted Alspach and Akihisa Okui, I decided to create a Telegram bot that emulates the game's mechanics, allowing users to play the game using their phones. The game is a social deduction game, where players are assigned roles with different abilities, and have to deduce the identities of other players to win. 

After about three weeks of development, I have completed the first iteration of the game, implementing gameplay elements for the roles in the first game of the series, [One Night Ultimate Werewolf](https://beziergames.com/products/one-night-ultimate-werewolf).

You can find the source code for the project [here](https://github.com/shaunnope/unoxwolf).

## Setup
For this project, I decided to use the [grammY](https://grammy.dev/) to develop the bot, as it provides a simple interface for interacting with the Telegram Bot API. I also used TypeScript to develop the bot, as it provides static typing and other features that make development easier.

The initial template for this project was adapted from [Telegram Bot Template](https://github.com/bot-base/telegram-bot-template), using a PostgreSQL database to store game data and a Redis database to store session data.

## Gameplay
The game interface is adapted from [Werewolf for Telegram](https://github.com/GreyWolfDev/Werewolf), which allows users to join games from a group chat and perform actions in a private chat. One difference I wanted to implement was to allow users to create multiple games in a single group, using Telegram's topics feature to distinguish between games. This would allow a large group of users to play multiple games concurrently in a single group chat, without having to wait for a game to end before starting a new one.

## The `Game` class
grammY provides a framework for handling updates from the Telegram Bot API, and I used this to implement the handling of user actions. However, as updates are localised to a chat, the control of game state and timing cannot be handled naturally by grammY. To solve this, I created a `Game` class that manages the game state and timing, and used grammY's session plugin to store a reference to the ID of the `Game` instance in the session data. This allows the `Game` object to be updated and accessed from any update handler.

## Actions and Events
One of the primary issues I have with the One Night Ultimate series is the verbosity and complexity of the narration used during the game, especially when multiple roles are included in play. The main reason for this is the limitation of a physical game, where role actions have to be performed sequentially, and the narration has to be able to accommodate all possible combinations of roles. However, this can be mitigated in a digital manifestation of the game, as actions can be received concurrently and processed in sequence behind the scenes. This also has the added benefit of reducing the length of the game, as players do not need to wait for the narration to finish before performing their actions.

To acheive this, I decided to implement a system of actions and events to handle the game logic. Actions are performed by players, and are received concurrently during timed phases of the game.
They can trigger events, which are pushed to an array in the `Game` object to be processed at the end of the phase.

### Actions
For the first iteration, I implemented the following actions:
- `Vote`: Players can vote to eliminate another player after the night phase.
- `Swap`: Roles like the Robber and Troublemaker can swap roles between players.
- `Peek`: Roles like the Seer can peek at the roles of other players.
- `Reveal`: Roles like the Werewolf and Mason reveal their roles to each other.
- `Copy`: Roles like the Doppleganger can copy the role of another player.

Excluding the `Reveal` action, all other actions require explicit player input, and thus emit a corresponding event when performed. The `Reveal` action is performed automatically during the night phase, and thus does not emit an event.

### Events
Events are collected in an array in the `Game` object, and are sorted by priority at the end of each phase before being processed.

Excluding the `Vote` event, all other events are logged in the game's `timeline`, which is used to expose the game's history to players at the end of the game.

## Challenges
### Conversations
Initially, I wanted to implement the logic for handling user input using grammY's conversation plugin, which provides an interface for persistent states across multiple messages. However, this was proven to be difficult, due to a misconception I had with how updates were handled by grammY. I had assumed that conversations could be entered using any `Context` object associated with a chat, but this was not the case. Through experimentation and closer reading of the documentation, I realised that conversations could only be reliably entered using the most recent `Context` object associated with a chat. In retrospect, this makes sense, given how updates are passed between handlers in grammY.

In the current implementation of the game, only the first `Context` object associated with a chat is stored in the `Game` object. Hence, conversations as I had initially envisioned them would not be possible, as the `Game` object would not be able to access the `Context` object required to enter the conversation. After further deliberation, I realised that this was not a major issue, as only a few scenarios in the game require obtaining multiple inputs from a single player. For the current stage of the project, this is limited to the `Troublemaker` role, which requires the user to select two players to swap roles with. 

Instead, I decided to use the conversation plugin as intended, using the update handler invoked for the first user input to enter the conversation. This first input is stored in the chat session before entering the conversation, and retrieved within the conversation to perform the required action.

### Timers
I was initially unsure of how to properly time the phases of the game, as I intended each phase to have a fixed duration with an option to skip to the next phase. I considered using `setTimeout` to trigger the next phase, but this would not allow me to skip to the next phase. To solve this, I referred to the timer implementation used in [Werewolf for Telegram](https://github.com/GreyWolfDev/Werewolf) and adapted it to my use case.


## Next Steps
I had intended to containerise the bot using Docker, but I was unable to do so due to issues with an ESBuild conflict arising from cross-OS development. I will be looking into this issue in the coming weeks.

Additionally, I am intending to set up a CI/CD pipeline for the project, as well as a staging environment for testing. This will allow me to test new features before deploying them to the production environment.

Before that, I will look into setting up webhooks for the bot, as I am currently using long-polling to receive updates from the Telegram Bot API. This is not ideal, as it requires the bot to be hosted on a server that is always running, and is not scalable. Webhooks would allow me to host the bot on a serverless platform, such as AWS Lambda, which would be more cost-effective and scalable.

## Further Plans
Subsequently, I will be adapting more of the roles in the One Night Ultimate series into the bot. I will also be looking into implementing a web interface for the bot, which would allow users to play the game without having to use Telegram. 

I also hope to implement achievements, much like the ones in Werewolf for Telegram. This would provide an incentive for players to play more games, and the tooling involved to achieve this would also allow me to track the usage of the bot.
