enum Operation {
    Search(String), // search vector db for a term
    Ask(String),    // ask a question back to the customer
    Answer(String), // answer a question
    Email(String),  // ask the customer for an email to forward to the admin
    NotFound,       // the customer's question was not found
}

// pub async fn get_response(message: &)

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {}
}
