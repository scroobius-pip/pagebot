git pull &&
cargo build &&
supervisorctl stop pagebotapi:pagebot &&
rm /home/alwyzon/pagebotapi_bin
cp /home/alwyzon/pagebot/api/target/debug/pagebotapi /home/alwyzon/pagebotapi_bin
supervisorctl start pagebotapi:pagebot
