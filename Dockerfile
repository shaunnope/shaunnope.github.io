# Use an official Ruby runtime as a parent image
FROM ruby:3.3

# Set the working directory in the container
WORKDIR /usr/src/app

# Install required packages
RUN apt-get update -qq && apt-get install -y build-essential nodejs

# Install Jekyll and Bundler gems
RUN gem install jekyll bundler

# Copy the current directory contents into the container
COPY . .

# Install dependencies from Gemfile (if available)
RUN bundle install

# Expose port 4000 to be accessible from outside the container
EXPOSE 4000

# Set the default command to build and serve the Jekyll site
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]
