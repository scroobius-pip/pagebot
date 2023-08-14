git pull &&
cargo build --release &&
supervisorctl stop pagebotapi &&
rm /home/simdi/pagebotapi_bin
cp /home/simdi/Arible/api_service/target/release/pagebotapi /home/simdi/pagebotapi_bin
supervisorctl start pagebotapi
