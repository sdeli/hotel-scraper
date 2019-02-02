use hotel_data_db;

select * from emails_of_websites;
select count(distinct hotel_webistes.website_id) from hotel_webistes inner join emails_of_websites
on hotel_webistes.website_id = emails_of_websites.website_id;
select count(email_id) from emails;