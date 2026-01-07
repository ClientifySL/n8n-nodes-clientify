module.exports = {
  contacts: {
    list:
      'id,owner_id,first_name,last_name,status,title,company_id,contact_type,contact_source,picture_url,description,remarks,summary,created',
    detail:
      'id,owner_id,first_name,last_name,status,title,company_id,company_name,company_picture,contact_type,contact_source,picture_url,description,remarks,summary',
  },
  companies: {
    list:
      'id,name,sector,company_sector,business_name,taxpayer_identification_number,fax,number_of_employees,number_of_employees_desc,owner,owner_name,rank,rank_manual,picture_url,facebook_url,linkedin_url,twitter_url,private,last_viewed,last_interaction,facebook_id,twitter_id,linkedin_id,founded,online_since,full_contact_extra,approx_employees,description,remarks,summary,linkedin_picture_url,created,modified,youtube_url,instagram_url,owner_picture,industry',
    detail:
      'id,name,sector,company_sector,business_name,taxpayer_identification_number,fax,number_of_employees,number_of_employees_desc,owner,owner_name,rank,rank_manual,picture_url,facebook_url,linkedin_url,twitter_url,private,last_viewed,last_interaction,facebook_id,twitter_id,linkedin_id,founded,online_since,full_contact_extra,approx_employees,description,remarks,summary,linkedin_picture_url,created,modified,youtube_url,instagram_url,owner_picture,industry',
  },
  tasks: {
    list:
      'url,id,owner,owner_name,owner_id,assigned_to,assigned_to_name,assigned_to_id,name,description,remarks,due_date,start_datetime,end_datetime,duration,type,status,status_desc,task_type,type_desc,task_stage,related_companies,additional_option,location,guest_users,created,modified,related_contacts,priority,recurring_type,recurring_end_date,recurring_interval,tags,activity_type,url_meeting,assigned_to_picture,parent_task_id,colors,recurring_days_of_week,recurring_days_of_month,recurring_days_of_year,number_of_repetitions,outcome,meeting_goal,is_holiday',
    detail:
      'url,id,owner,owner_name,owner_id,assigned_to,assigned_to_name,assigned_to_id,assigned_to_picture,name,description,remarks,due_date,start_datetime,end_datetime,duration,type,status,status_desc,deals,task_type,type_desc,task_stage,priority,related_companies,related_companies_names,related_companies_data,related_contacts,related_contacts_names,related_contacts_data,related_deals_data,tags,notes,phone_number,colors,additional_option,location,guest_users,created,modified,completed_date,activity_type,parent_task,parent_task_id,recurring_days_of_week,recurring_days_of_month,recurring_days_of_year,recurring_type,recurring_end_date,recurring_interval,meeting_goal,url_meeting,number_of_repetitions,outcome,is_holiday',
  },
  users: {
    list: 'id,username,full_name',
    me: 'id,email,username,full_name',
  },
};
