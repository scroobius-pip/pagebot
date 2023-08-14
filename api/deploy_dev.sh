git pull &&
cargo build &&
supervisorctl stop pagebotapi &&
rm /home/alwyzon/pagebotapi_bin
cp /home/alwyzon/pagebot/api/target/release/pagebotapi /home/alwyzon/pagebotapi_bin
supervisorctl start pagebotapi
