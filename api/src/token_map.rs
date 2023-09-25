use std::{collections::HashMap, sync::Mutex};
struct TokenMap {
    tokens: HashMap<Token, i64>, // token+email -> (expiry)
}

impl TokenMap {
    fn new() -> Self {
        Self {
            tokens: HashMap::new(),
        }
    }

    fn insert(&mut self, token: Token) {
        let expiry = chrono::Utc::now().timestamp() + 600; //expires in 10 minutes
        _ = self.tokens.insert(token, expiry);

        //take modulus of token count and use it to decide if to remove expired tokens
        if self.tokens.len() % 100 == 0 {
            self.tokens
                .retain(|_, expiry| expiry > &mut chrono::Utc::now().timestamp());
        }
    }

    fn valid(&mut self, token: Token) -> bool {
        if let Some(expiry) = self.tokens.remove(&token) {
            if expiry > chrono::Utc::now().timestamp() {
                return true;
            }
        }
        false
    }
}

#[derive(Debug, PartialEq, Eq, Hash, Clone)]
pub struct Token(String);

impl Token {
    pub fn new(email: String) -> Self {
        let token = Self::generate_token();
        Self::from_token(email, token)
    }

    pub fn from_token(email: String, token: String) -> Self {
        let _value = format!("{}{}", token, email);
        Self(_value)
    }

    pub fn save(self) -> Self {
        let mut token_map = TOKEN_MAP.lock().unwrap();
        token_map.insert(self.clone());
        self
    }

    pub fn valid(&self) -> bool {
        let mut token_map = TOKEN_MAP.lock().unwrap();
        token_map.valid(self.clone())
    }

    fn get_parts(&self) -> (String, String) {
        let parts = self.0.split_at(6);
        (parts.0.to_string(), parts.1.to_string())
    }

    pub fn get_token(&self) -> String {
        self.get_parts().0
    }

    fn generate_token() -> String {
        let alphabet: [char; 30] = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', /* 10 */
            'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', /* 19 */
            'U', 'V', 'W', 'X', 'Y', 'Z', '3', '4', '5', /* 29 */
            '6', '7', '8', '9', /* 30 */
        ];

        nanoid::nanoid!(6, &alphabet)
    }
}

lazy_static! {
    static ref TOKEN_MAP: Mutex<TokenMap> = Mutex::new(TokenMap::new());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token() {
        let email = "test1@test.com".to_string();
        let token = Token::new(email.clone());
        let (token_, email_) = token.get_parts();
        assert_eq!(email, email_);
        assert_eq!(token.0.len(), 6 + email.len());
    }

    #[test]
    fn test_token_valid() {
        let token = Token::new("test@test.com".to_string());
        let mut token_map = TOKEN_MAP.lock().unwrap();
        token_map.insert(token.clone());
        assert!(token_map.valid(token));
    }

    #[test]
    fn test_token_invalid() {
        let token = Token::new("test@test.com".to_string());
        let mut token_map = TOKEN_MAP.lock().unwrap();
        token_map.insert(token.clone());
        assert!(token_map.valid(token.clone()));
        assert!(!token_map.valid(token));
    }
}
