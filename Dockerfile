FROM php:8.2-apache

# Enable Apache modules
RUN a2enmod rewrite

# Change Apache to listen on port 10000
RUN sed -i 's/Listen 80/Listen 10000/g' /etc/apache2/ports.conf && \
    sed -i 's/:80>/:10000>/g' /etc/apache2/sites-available/000-default.conf

RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable mysqli

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Set permissions for uploads directory
RUN mkdir -p /var/www/html/uploads && chmod 777 /var/www/html/uploads

# Expose port 10000
EXPOSE 10000
