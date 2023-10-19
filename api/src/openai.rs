use async_openai::config::OpenAIConfig;

lazy_static! {
    pub static ref OPENAI_CLIENT: async_openai::Client<OpenAIConfig> =
        async_openai::Client::with_config(
            OpenAIConfig::default().with_api_key(dotenv!("OPENAI_API_KEY")),
        );
}
