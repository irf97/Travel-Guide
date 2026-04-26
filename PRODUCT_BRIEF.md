# Product Brief: Social Travel Intelligence

## What this is

Social Travel Intelligence is an investor-facing prototype for a travel decision engine.

It is not meant to be only a travel guide. It is a demonstration of how group travel can be modeled as an outcome-optimization problem.

The dashboard ranks destinations for young adult groups by combining:

- total budget per person
- stay length
- preferred date range or entire-month exploration
- social density
- nightlife strength
- historic and cultural depth
- international tourist mix
- resident nationality mix
- gender-ratio proxy
- seasonality by month
- estimated budget pressure
- walkability and accommodation-location logic

## Why it matters

Most travel tools optimize for price, availability, reviews, or generic recommendations.

Young adult group trips fail or succeed for different reasons:

- the accommodation is too far from the social zone
- flights are cheap but timing is bad
- the city is beautiful but socially dead in that month
- the villa is good but taxis kill spontaneity
- the nightlife exists but does not match the group profile
- the city is cheap but has weak international social liquidity

This prototype shows a different product thesis:

> The best trip is not the cheapest city. The best trip is the city with the highest probability of social success within the group's constraints.

## Target user

Primary user:

- young adults, roughly 20–35
- groups of friends
- budget-conscious but experience-driven
- interested in nightlife, meeting international people, beaches, history, and cultural density

Secondary user:

- travel planners
- student travel groups
- bachelor-style group trips
- digital nomad/social trip organizers
- travel agencies wanting better recommendation logic

## Investor framing

This prototype demonstrates the frontend and decision logic of a possible product category:

**Social Travel Operating System**

Instead of asking only “Where is cheap?”, the system asks:

- Where will this group actually have the best outcome?
- Which month changes the ranking?
- Which destination fits the budget cap?
- Which place has the best international social pool?
- Which location avoids taxi dependency?
- Which cities are good on paper but weak for this exact group?

## Current prototype limitations

The dashboard currently uses model estimates and proxy datasets for demonstration.

Before commercial use, it should connect to live and official sources such as:

- flight price APIs
- accommodation price APIs
- event and nightlife APIs
- official tourism statistics
- city population registries
- mobility and transfer-time data
- user feedback after completed trips

## Future roadmap

1. Live flight and accommodation pricing
2. City-level and neighborhood-level scoring
3. Real-time event calendar integration
4. Social venue density and review analysis
5. Group preference intake
6. Personalized itinerary generation
7. Booking guardrails
8. Post-trip feedback loop
9. Calibration layer to improve destination ranking over time

## Current demo

The current demo is hosted as a static site from the `site/` folder and can be deployed with GitHub Pages.
