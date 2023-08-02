---
layout: post
title:  "Creating a REST API with Rails"
date:   2023-07-23 00:00:00 +0800
categories: blog
tags: [ruby, rest-api, rails, docker]
---
Held from 4 July to 23 July 2023, the backend development mini challenge hosted by the Center for Strategic Infocomm Technologies (CSIT) was a great opportunity to learn more about the Ruby on Rails framework. The challenge was to create a REST API to read from a Mongo Atlas database and return JSON responses at two specified endpoints. As the choice of programming language was left to the participants, I decided to use Ruby on Rails to familiarise myself with programming in Ruby. The API was to be containerised using Docker for validation and deployment. 
<!--more-->

This article will cover the steps I took to create the REST API and containerise it with Docker. The source code for the project can be found [on Github](https://github.com/shaunnope/csit-se-2023).


## Challenge Overview
The crux of this challenge was to set up a REST API server with two endpoints (`/flight` and `/hotel`) that would return the cheapest flight and hotel options respectively. The flight and hotel data were to be retrieved from a provided Mongo Atlas database, and the responses were to be in a specified JSON format. 

The challenge can be broken down into the following steps:
- [Challenge Overview](#challenge-overview)
- [Setting up a Rails app](#setting-up-a-rails-app)
- [Creating models for the flight and hotel data](#creating-models-for-the-flight-and-hotel-data)
- [Defining the endpoints and associated controllers](#defining-the-endpoints-and-associated-controllers)
- [Validating the query parameters](#validating-the-query-parameters)
- [Querying from the Mongo Atlas database](#querying-from-the-mongo-atlas-database)
- [Processing the results and returning the responses](#processing-the-results-and-returning-the-responses)
- [Containerising the app](#containerising-the-app)
- [Reflections](#reflections)
- [Credits](#credits)

## Setting up a Rails app
The first step was to set up a Rails app. As this was my first time using Rails, I relied on the [Rails Guides](https://guides.rubyonrails.org/api_app.html) to get started. The following command was used to create the app:
```bash
$ rails new api --api --skip-active-record
```
The `--api` flag was used to create an API-only Rails app, while the `--skip-active-record` flag was used to skip the creation of a database configuration file. This was because the data was to be retrieved from a Mongo Atlas database, and not a SQL database.

To connect to the Mongo Atlas database, I used [mongoid](https://docs.mongodb.com/mongoid/current/tutorials/getting-started-rails/), an Object-Document Mapper (ODM) for MongoDB, written in Ruby. This was done by adding the following line to the `Gemfile`:
```ruby
# Gemfile
gem 'mongoid', '~> 7.0.5'
```
Then, the following command was used to generate the configuration file for mongoid:
```bash
$ rails g mongoid:config
```
The configuration file was then edited to include the connection string to the Mongo Atlas database:
```ruby
# config/mongoid.yml
development:
  clients:
    default:
      uri: mongodb+srv://<username>:<password>@<cluster-url>/minichallenge

```

## Creating models for the flight and hotel data
Analysing the database using [MongoDB Compass](https://www.mongodb.com/products/compass), I recreated the schema for the flight and hotel data in the `app/models` directory. For example, the `Hotel` model was defined as follows:
```ruby
# app/models/hotel.rb
class Hotel
    include Mongoid::Document

    field :city, type: String
    field :hotelName, type: String
    field :price, type: Integer
    field :date, type: Date

end
```

## Defining the endpoints and associated controllers
To define the endpoints and associated controllers, I added the following lines to the `routes.rb` file:
```ruby
# config/routes.rb
Rails.application.routes.draw do
  resources :flight, only: [:index]
  resources :hotel, only: [:index]
end
```
The `resources` method was used to define the endpoints, and the `only` option was used to specify the actions that were to be included. In this case, only the `index` action was included.

The files for the controllers were then created in the `app/controllers` directory. For example, the `FlightController` was defined as follows:
```ruby
# app/controllers/flight_controller.rb
class FlightController < ApplicationController
    def index
        # ...
    end
end
```

## Validating the query parameters
Both endpoints accept similar parameters, namely a start date (`departureDate` or `checkInDate`), an end date (`returnDate` or `checkOutDate`), and a destination (`destination`). Within the context of this challenge, the source location was fixed to Singapore. 

The main thing to validate was the date format. The date format was specified as `YYYY-MM-DD`. To validate the date format, I defined a validator library in `lib/validator.rb` as follows:
```ruby
# lib/validator.rb
module Validator
    def valid_date?(date)
        (date =~ /^\d{4}-\d{2}-\d{2}$/ || false) && Date.parse(date)
    rescue Date::Error
        false
    end
end
```
The `valid_date?` method returns `false` if the date format is invalid or the date is invalid, and returns the date as a `Date` otherwise.

We also need to validate that all the required parameters are present. Putting it all together, the following code was used to validate the query parameters for the `/flight` endpoint:
```ruby
# app/controllers/flight_controller.rb > FlightController#index
# Validate query parameters
departureDate = valid_date?(params[:departureDate])
returnDate = valid_date?(params[:returnDate])
destination = params[:destination]
missing = %w(departureDate returnDate destination).select { |param| params[param].nil? }
if missing.length > 0
    render json: {
            error: "Missing query parameters", 
            status: 400,
            missing: missing
        }, status: :bad_request
    return
elsif !departureDate || !returnDate
    render json: {
            error: "Invalid date format", 
            status: 400,
            departureDate: departureDate,
            returnDate: returnDate
        }, status: :bad_request
    return
end
# ...
```

## Querying from the Mongo Atlas database
The next step was to define the logic for querying from the Mongo Atlas database. 

The pseudo-code to query for the cheapest flight is as follows:
1. Find the all flights where `destcity==destination` and `date==departureDate`.
2. Group the results by `price`, collecting the `airlinename` for all flights with the same price
3. Sort the results by price in ascending order
4. Set the limit to 1 to return the cheapest flights
5. Repeat steps 1 to 4 for `destcity=="Singapore"` and `date==returnDate`.
6. Combine the results from steps 4 and 5 to find the cheapest round-trip flights

Similarly, the pseudo-code to query for the cheapest hotel is as follows:
1. Find the all hotels where `city==destination` and `checkInDate<=date<=checkOutDate`.
2. Group the results by `hotelName`, computing the total `price` for each hotel within the date range
3. Sort the results by price in ascending order
4. Set the limit to 1 to return the cheapest hotel

To acheive this using Mongoid, I used the Aggregation Pipeline. For example, the following code was used to query for the cheapest hotel:
```ruby
# app/controllers/hotel_controller.rb > HotelController#index
# Validate query parameters
# ...

# Query for the cheapest hotel
query = Hotel.collection.aggregate([
    { "$match" => {
        "city" => destination,
        "date" => {"$gte" => checkInDate, "$lte" => checkOutDate}
    }},
    # compute total price for each hotel for the entire stay
    { "$group" => {
            "_id" => "$hotelName",
            "price" => { "$sum" => "$price" },
        }
    },
    # collect all hotels with the same price
    { "$group" => {
        "_id" => "$price",
        "hotels" => { "$push" => "$_id" }
    }},
    { "$sort" => { _id: 1 }},
    { "$limit" => 1 } # get the cheapest hotels
])

# ...
```

## Processing the results and returning the responses
The final step was to process the results and return the responses in the expected JSON format. For example, the following code was used to process the results for the `/hotel` endpoint:
```ruby
# app/controllers/hotel_controller.rb > HotelController#index
# Validate query parameters
# ...
# Query for the cheapest hotel
# ...
# Process the results
@result = []
query.each do |min_price|
    min_price["hotels"].each do |h|
        @result << {
            "City" => destination,
            "Check In Date" => checkInDate,
            "Check Out Date" => checkOutDate,
            "Hotel" => h,
            "Price" => min_price["_id"]
        }
    end
end
render json: @result, status: :ok
```

## Containerising the app
The final step was to containerise the app with Docker. The following `Dockerfile` was used:
```dockerfile
# Dockerfile
FROM ruby:3.0.2
RUN apt-get update -qq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man

WORKDIR /csit
ENV PORT=8080

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .
RUN bundle exec bootsnap precompile --gemfile app/ lib/

EXPOSE 8080
CMD ["./bin/rails", "s", "-b", "0.0.0.0", "-p", "8080"]
```
The app was then built and run using the following commands:
```bash
$ docker build -t csit-se-2023 .
$ docker run -p 8080:8080 csit-se-2023
```
Setting the `-b` flag to `0.0.0.0` was necessary to allow the app to be accessed from outside the container.

## Reflections
Overall, I completed the challenge in 2 days, and I was able to learn a lot about Ruby on Rails and Docker in the process. One particular gripe I had with the challenge was that the expected responses were not precisely defined. For example, the example response for the `/hotel` endpoint was as follows:
```json
[
  {
    "City": "Frankfurt",
    "Check In Date": "2023-12-10",
    "Check Out Date": "2023-12-16",
    "Hotel": "Hotel J",
    "Price": 2959
  }
]
```
It was initially unclear to me that the example response should match the results for the example query parameters. This meant that the keys in the response had to match the example response exactly. However, the bigger issue was in the definition of the `Price` key. The `Price` key was defined as the sum of the prices for each day of the stay, inclusive of the start and end dates. This was not explicitly stated in the challenge description, and I only realised this through trial and error.

## Credits
With this being my first time developing a Rails app, I relied on the following resources to get started:
* [Rails Guides: Using Rails for API-only Applications](https://guides.rubyonrails.org/api_app.html)
* [RapidAPI: How to Build a RESTful API in Ruby](https://rapidapi.com/blog/how-to-build-an-api-in-ruby/)
* [Oliver DS: Creating a REST API with Rails](https://medium.com/@oliver.seq/creating-a-rest-api-with-rails-2a07f548e5dc)
* [MongoDB: Mongoid Manual - Getting Started (Rails 7)](https://www.mongodb.com/docs/mongoid/current/tutorials/getting-started-rails7/)
* [Fly.io: Rails on Docker](https://fly.io/ruby-dispatch/rails-on-docker/)
* [Awesome Compose: Compose and Rails](https://github.com/docker/awesome-compose/tree/master/official-documentation-samples/rails/)
