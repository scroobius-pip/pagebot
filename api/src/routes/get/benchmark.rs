use reqwest::StatusCode;

use crate::routes::GenericResponse;

pub async fn main() -> GenericResponse<String> {
    //"loaderio-e9de48ff1701b85b1c3a4c279656f82f"
    Ok((
        StatusCode::OK,
        "loaderio-f6e0730790630a9271de186889ff3c19".to_string(),
    ))
}
